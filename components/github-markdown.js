"use strict";

import { Github } from '/lib/github.js';
import { Argument } from '/lib/argument.js';

export class GithubMarkdownComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

        const accountName = container.getAttribute("account");
        const documentUri = container.getAttribute("uri");
        if (!documentUri)
        {
            throw new Error("github-markdown: 'uri' attribute is required.");
        }

        this.container = container;
        this.accountName = accountName;
        this.documentInfo = GithubMarkdownComponent.#parseDocumentUri(documentUri);
    }

    render()
    {
        // TODO: cache

        const personalAccessToken = Github.getPersonalAccessToken(this.accountName);

        return GithubMarkdownComponent
            .#fetchDocument(this.documentInfo, personalAccessToken)
            .then(markdown => this.container.innerHTML = marked(markdown));
    }

    static #fetchDocument(documentInfo, accessToken)
    {
        return fetch(
            `https://api.github.com` +
                `/repos/${documentInfo.owner}/${documentInfo.repo}` +
                `/contents/${documentInfo.path}` +
                `?ref=${documentInfo.branch}`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            .then(c => c.text());
    }

    static #parseDocumentUri(uri)
    {
        // TODO: centralized error reporting

        const documentUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<branch>[^\/]+)\/(?<path>.+)/i;
        const match = documentUriRegex.exec(uri);
        if (!match)
        {
            throw new Error("Document URI is in unexpected format.");
        }

        const { owner, repo, branch, path } = match.groups;

        return { owner, repo, branch, path };
    }
}