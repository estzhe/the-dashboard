import Github from '/components/github/github.js';
import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';

export default class GithubIssuesComponent extends BaseComponent
{
    #accountName;
    #repoInfo;
    #title;
    #filter;

    constructor(root, container)
    {
        super(root, container);

        const accountName = container.getAttribute("account");
        const repo = container.getAttribute("repo");
        if (!repo)
        {
            throw new Error("github-issues: 'repo' attribute is required.");
        }
        const filterString = container.getAttribute("filter");

        this.#accountName = accountName;
        this.#repoInfo = GithubIssuesComponent.#parseRepoUri(repo);
        this.#title = container.getAttribute("title");
        this.#filter = filterString ? GithubIssuesComponent.#parseFilterString(filterString) : null;
    }

    static get name() { return "github-issues"; }

    async render()
    {
        const accessToken = Github.getPersonalAccessToken(this.#accountName);

        let issues = await GithubIssuesComponent.#fetchIssues(
            this.#repoInfo.owner,
            this.#repoInfo.repo,
            accessToken);
        issues = GithubIssuesComponent.#filterIssues(issues, this.#filter);
        issues = issues.sort((i1, i2) => i2.updated_at.localeCompare(i1.updated_at));   // recent first

        const data = {
            title: this.#title,
            url: `https://github.com/${this.#repoInfo.owner}/${this.#repoInfo.repo}/issues`,
            issues,
        };

        this._container.innerHTML = await this._template("template", data);

        const elements = {
            dialog: this._container.querySelector("dialog.issue-viewer"),
            items: this._container.querySelectorAll(".item"),
        };

        elements.dialog.addEventListener("keydown", e =>
        {
            if (e.key === "Escape")
            {
                e.preventDefault();
                elements.dialog.close();
            }
        });

        for (const item of this._container.querySelectorAll(".item"))
        {
            item.addEventListener("click", async e =>
            {
                if (e.ctrlKey || e.shiftKey) return;
                
                e.preventDefault();

                const issueId = Number(e.target.closest(".item").dataset.issueId);
                const issue = issues.find(x => x.id === issueId);

                const data = {
                    issue,
                    bodyHtml: marked(issue.body),
                };

                elements.dialog.innerHTML = await this._template("issue-preview", data);

                elements.dialog.showModal();
            });
        }
    }

    static async #fetchIssues(repoOwner, repoName, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(repoOwner, "repoOwner");
        Argument.notNullOrUndefinedOrEmpty(repoName, "repoName");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        return await response.json();
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