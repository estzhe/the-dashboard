import Github from '/components/github/github.js';
import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import { marked } from 'marked';

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
        this.#filter = options.filter ? GithubIssuesComponent.#parseFilterString(options.filter) : null;
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
        issues = issues.sort((i1, i2) => i2.updated_at.localeCompare(i1.updated_at));   // recent first

        let filterQuery = "is:open is:issue";
        if (this.#filter.include.length !== 0)
        {
            filterQuery += " " + this.#filter.include.map(tag => `label:${tag}`).join(" ");
        }
        if (this.#filter.exclude.length !== 0)
        {
            filterQuery += " " + this.#filter.exclude.map(tag => `-label:${tag}`).join(" ");
        }

        const data = {
            title: this.#title,
            url: `https://github.com/${this.#repoInfo.owner}/${this.#repoInfo.repo}/issues?q=${encodeURIComponent(filterQuery)}`,
            issues,
        };

        container.innerHTML = await this._template("template", data);

        const elements = {
            title: container.querySelector(".issues-title"),
            dialog: container.querySelector("dialog.issue-viewer"),
            items: container.querySelectorAll(".item"),
        };

        elements.title.addEventListener("click", e =>
        {
            if (e.altKey)
            {
                e.preventDefault();

                let newIssueUri = `https://github.com/${this.#repoInfo.owner}/${this.#repoInfo.repo}/issues/new`;
                if (this.#filter.include.length !== 0)
                {
                    newIssueUri += "?labels=" + encodeURIComponent(this.#filter.include.join(","));
                }
                
                window.location.href = newIssueUri;
            }
        });

        elements.dialog.addEventListener("keydown", e =>
        {
            if (e.key === "Escape")
            {
                e.preventDefault();
                elements.dialog.close();
            }
        });

        for (const item of elements.items)
        {
            item.addEventListener("click", async e =>
            {
                if (e.ctrlKey || e.shiftKey) return;
                
                e.preventDefault();

                const issueId = Number(e.target.closest(".item").dataset.issueId);
                const issue = issues.find(x => x.id === issueId);
                const comments = await GithubIssuesComponent.#fetchIssueComments(
                    this.#repoInfo.owner,
                    this.#repoInfo.repo,
                    issue.number,
                    Github.getPersonalAccessToken(this.#accountName),
                );

                const data = {
                    issue,
                    bodyHtml: marked(issue.body ?? "", { breaks: true }),
                    comments: comments.map(c => ({
                        bodyHtml: marked(c.body ?? "", { breaks: true})
                    })),
                };

                elements.dialog.innerHTML = await this._template("issue-preview", data);
                elements.dialog.showModal();
            });
        }
    }

    async #getIssues(refreshData)
    {
        return await this._services.cache.component.get(
            `${this.#repoInfo.owner}.${this.#repoInfo.repo}.issues`,
            async () =>
            {
                const accessToken = Github.getPersonalAccessToken(this.#accountName);

                return await GithubIssuesComponent.#fetchIssues(
                    this.#repoInfo.owner,
                    this.#repoInfo.repo,
                    accessToken);
            },
            refreshData);
    }

    static async #fetchIssues(repoOwner, repoName, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(repoOwner, "repoOwner");
        Argument.notNullOrUndefinedOrEmpty(repoName, "repoName");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        const MAX_ISSIES_PER_PAGE = 100;
        
        const issues = [];

        let page = 1;
        let issuesOnPage;
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/issues` +
                    `?state=open` +
                    `&per_page=${MAX_ISSIES_PER_PAGE}` +
                    `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${accessToken}`
                    }
                });

            issuesOnPage = await response.json();
            issues.push(...issuesOnPage);

            page++;
        }
        while (issuesOnPage.length >= MAX_ISSIES_PER_PAGE);

        return issues;
    }

    static async #fetchIssueComments(repoOwner, repoName, issueNumber, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(repoOwner, "repoOwner");
        Argument.notNullOrUndefinedOrEmpty(repoName, "repoName");
        Argument.isNumber(issueNumber, "issueNumber");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        const MAX_COMMENTS_PER_PAGE = 100;
        
        const comments = [];

        let page = 1;
        let commentsOnPage;
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments` +
                    `?per_page=${MAX_COMMENTS_PER_PAGE}` +
                    `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${accessToken}`
                    }
                });

            commentsOnPage = await response.json();
            comments.push(...commentsOnPage);

            page++;
        }
        while (commentsOnPage.length >= MAX_COMMENTS_PER_PAGE);

        return comments;
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
                if (expression.length == 1)
                {
                    throw new Error("An exclusion filtering expression must include a tag to exclude after '-' character.");
                }

                const tag = expression.substring(1);
                exclude.push(tag);
            }
            else
            {
                include.push(expression);
            }
        }

        return { include, exclude };
    }
}