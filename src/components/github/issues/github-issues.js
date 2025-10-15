import Github from 'app/components/github/github.js';
import Argument from 'app/lib/argument.js';
import BaseComponent from 'app/components/base-component.js';
import GithubClient from "app/components/github/github-client.js";
import { Temporal, Intl } from "@js-temporal/polyfill";
import { marked } from 'marked';
import template from 'app/components/github/issues/template.hbs';
import issuePreviewTemplate from 'app/components/github/issues/issue-preview.hbs';
import dueDateSelectorTemplate from 'app/components/github/issues/due-date-selector.hbs';

export default class GithubIssuesComponent extends BaseComponent
{
    #accountName;
    #repoInfo;
    #title;
    #filter;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.repo)
        {
            throw new Error("github-issues: 'repo' attribute is required.");
        }
        
        this.#accountName = options.account;
        this.#repoInfo = GithubIssuesComponent.#parseRepoUri(options.repo);
        this.#title = options.title;
        this.#filter = options.filter
            ? GithubIssuesComponent.#parseFilterString(options.filter)
            : { include: [], exclude: [] };
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const issues = await this.#getIssues(refreshData);
        await this.#renderIssues(container, issues);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getIssues(/* refreshData */ true);
    }

    async #renderIssues(container, issues)
    {
        issues = GithubIssuesComponent.#filterIssues(issues, this.#filter);
        issues = issues
            .sort((i1, i2) => i2.updated_at.localeCompare(i1.updated_at))   // recent first
            .map(issue =>
            {
                const dueDateLabel = issue.labels.find(l => l.name.startsWith("due:"))?.name;
                if (dueDateLabel &&
                    /due:\s*\d{4}-\d{1,2}-\d{1,2}/.test(dueDateLabel))
                {
                    const dueDate = Temporal.PlainDate.from(dueDateLabel.replace("due:", "").trim());
                    issue.due_on = dueDate;
                    issue.is_past_due = Temporal.PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) < 0;
                    issue.is_due_today = Temporal.PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) === 0;
                }
                return issue;
            });

        let filterQuery = "is:open is:issue";
        if (this.#filter.include.length !== 0)
        {
            filterQuery += " label:" + this.#filter.include.join(",");
        }
        if (this.#filter.exclude.length !== 0)
        {
            filterQuery += " " + this.#filter.exclude.map(label => `-label:${label}`).join(" ");
        }

        const data = {
            title: this.#title,
            url: `https://github.com/${this.#repoInfo.owner}/${this.#repoInfo.repo}/issues?q=${encodeURIComponent(filterQuery)}`,
            issues,
        };

        container.innerHTML = template(data);

        const elements = {
            container,
            title: container.querySelector(".issues-title"),
            dialog: container.querySelector("dialog.issue-viewer"),
            items: Array.from(container.querySelectorAll(".item")),
            scheduleButtons: Array.from(container.querySelectorAll(".schedule-button")),
            schedulePopover: container.querySelector(".schedule-popover"),
        };

        elements.title?.addEventListener("click", e =>
        {
            if (e.altKey)
            {
                e.preventDefault();

                let newIssueUri = `https://github.com/${this.#repoInfo.owner}/${this.#repoInfo.repo}/issues/new`;
                if (this.#filter.include.length !== 0)
                {
                    newIssueUri += "?labels=" + encodeURIComponent(this.#filter.include.join(","));
                }
                
                window.open(newIssueUri, "_blank").focus();
            }
        });
        
        await this.#renderIssuePreviewer(elements, issues);
        await this.#renderScheduleSelector(elements, issues);
    }
    
    async #renderIssuePreviewer(elements, issues)
    {
        for (const item of elements.items)
        {
            item.addEventListener("click", async e =>
            {
                if (e.ctrlKey || e.shiftKey) return;

                e.preventDefault();

                const issueId = Number(e.target.closest(".item").dataset.issueId);
                const issue = issues.find(x => x.id === issueId);

                const accessToken = await Github.getPersonalAccessToken(this._services.storage, this.#accountName);
                const client = new GithubClient(accessToken);
                const comments= await client.fetchIssueComments(this.#repoInfo.owner, this.#repoInfo.repo, issue.number);

                const data = {
                    issue,
                    bodyHtml: marked(issue.body ?? "", { breaks: true }),
                    comments: comments.map(c => ({
                        bodyHtml: marked(c.body ?? "", { breaks: true})
                    })),
                };

                elements.dialog.innerHTML = issuePreviewTemplate(data);
                elements.dialog.showModal();
            });
        }
    }
    
    async #renderScheduleSelector(elements, issues)
    {
        elements.scheduleButtons.forEach(action =>
        {
            action.addEventListener("click", e =>
            {
                e.preventDefault();
                e.stopPropagation();

                const issueId = Number(e.target.closest(".item").dataset.issueId);
                const issue = issues.find(x => x.id === issueId);

                const today = Temporal.Now.plainDateISO();
                const tomorrow = today.add({ days: 1 });
                
                const weekdays = [];
                const firstDayOfCurrentWeek = today.subtract({ days: today.dayOfWeek - 1 });
                const format = new Intl.DateTimeFormat('en-US', { weekday: "narrow" });
                for (
                    let date = firstDayOfCurrentWeek;
                    date.since(firstDayOfCurrentWeek).days < 14;
                    date = date.add({ days: 1 }))
                {
                    weekdays.push({
                        title: format.format(date),
                        isToday: date.equals(today),
                        isSelected: issue.due_on && date.equals(issue.due_on),
                    });
                }

                elements.schedulePopover.dataset.issueId = issueId;
                elements.schedulePopover.innerHTML = dueDateSelectorTemplate({
                    weekdays,
                    isTodaySelected: issue.due_on?.equals(today) === true,
                    isTomorrowSelected: issue.due_on?.equals(tomorrow) === true,
                    selectedDateIso8601: issue.due_on?.toString() ?? "",
                });
                
                elements.schedulePopover.querySelector(".today-button").addEventListener("click", async e =>
                {
                    const accessToken = await Github.getPersonalAccessToken(this._services.storage, this.#accountName);
                    const client = new GithubClient(accessToken);
                    
                    const freshIssue = await client.fetchIssue(this.#repoInfo.owner, this.#repoInfo.repo, issue.number);
                    
                    const labels = freshIssue.labels
                        .map(l => l.name)
                        .filter(l => !l.startsWith("due:"));
                    labels.push(`due: ${Temporal.Now.plainDateISO().toString()}`);
                    
                    await client.setIssueLabels(this.#repoInfo.owner, this.#repoInfo.repo, issue.number, labels);
                });
                
                elements.schedulePopover.showPopover({
                    source: e.target,
                });
            });
        });

        elements.schedulePopover.addEventListener("toggle", e => {
            const issueId = e.target.dataset.issueId;
            const sourceAction = elements.items.find(item => item.dataset.issueId === issueId).querySelector(".item-action:has(.schedule-button)");

            if (e.newState === "open")
            {
                sourceAction.classList.add("visible");
            }
            else
            {
                sourceAction.classList.remove("visible");
            }
        });
    }
    
    async #getIssues(refreshData)
    {
        return await this._services.cache.component.get(
            `${this.#repoInfo.owner}.${this.#repoInfo.repo}.issues`,
            async () =>
            {
                const accessToken = await Github.getPersonalAccessToken(this._services.storage, this.#accountName);
                const client = new GithubClient(accessToken);
                
                return await client.fetchIssues(this.#repoInfo.owner, this.#repoInfo.repo);
            },
            refreshData);
    }

    static #filterIssues(issues, filter)
    {
        Argument.notNullOrUndefined(issues, "issues");

        if (filter && filter.include.length !== 0)
        {
            // include if contains any of includes
            issues = issues.filter(
                issue => filter.include.some(
                    targetLabel => issue.labels.some(label => label.name === targetLabel)));
        }
        if (filter && filter.exclude.length !== 0)
        {
            // exclude if contains any of excludes
            issues = issues.filter(
                issue => filter.exclude.every(
                    targetLabel => issue.labels.every(label => label.name !== targetLabel)));
        }

        return issues;
    }

    static #parseRepoUri(repoUri)
    {
        Argument.notNullOrUndefinedOrEmpty(repoUri, "repoUri");

        const repoUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)/i;
        const match = repoUriRegex.exec(repoUri);
        if (!match)
        {
            throw new Error("Repo URI is in unexpected format.");
        }

        const { owner, repo } = match.groups;

        return { owner, repo };
    }

    static #parseFilterString(filter)
    {
        Argument.notNullOrUndefined(filter, "filter");

        const expressions = filter.split(/\s+/);

        const include = [];
        const exclude = [];
        for (const expression of expressions)
        {
            if (expression.startsWith("-"))
            {
                if (expression.length === 1)
                {
                    throw new Error("An exclusion filtering expression must include a label to exclude after '-' character.");
                }

                const label = expression.substring(1);
                exclude.push(label);
            }
            else
            {
                include.push(expression);
            }
        }

        return { include, exclude };
    }
}