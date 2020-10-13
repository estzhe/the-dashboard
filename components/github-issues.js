"use strict";

import { Github } from '../lib/github.js';
import { Argument } from '../lib/argument.js';

export class GithubIssuesComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

        const accountName = container.getAttribute("account");
        const repo = container.getAttribute("repo");
        if (!repo)
        {
            throw new Error("github-issues: 'repo' attribute is required.");
        }
        const filterString = container.getAttribute("filter");

        this.container = container;
        this.accountName = accountName;
        this.repoInfo = GithubIssuesComponent.#parseRepoUri(repo);
        this.title = container.getAttribute("title");
        this.filter = filterString ? GithubIssuesComponent.#parseFilterString(filterString) : null;
    }

    static get name() { return "github-issues"; }

    render()
    {
        const personalAccessToken = Github.getPersonalAccessToken(this.accountName);

        return fetch(
            `https://api.github.com/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/issues`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${personalAccessToken}`
                }
            })
        .then(c => c.json())
        .then(
            issues =>
            {
                let html = this.title ? `<h1>${this.title}</h1>` : "";
                
                let filteredIssues = issues;
                if (this.filter && this.filter.include.length !== 0)
                {
                    // include if contains any of includes
                    filteredIssues = filteredIssues.filter(
                        issue => this.filter.include.some(
                            targetLabel => issue.labels.some(label => label.name === targetLabel)));
                }
                if (this.filter && this.filter.exclude.length !== 0)
                {
                    // exclude if contains any of excludes
                    filteredIssues = filteredIssues.filter(
                        issue => this.filter.exclude.every(
                            targetLabel => issue.labels.every(label => label.name !== targetLabel)));
                }

                html += filteredIssues.map(i => `<div>${i.title}</div>`).join("\n");
                
                this.container.innerHTML = html;
            });
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