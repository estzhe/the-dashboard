import Github from 'app/components/github/github.js';
import Argument from 'app/lib/argument.js';
import BaseComponent from 'app/components/base-component.js';
import { marked } from 'marked';
import template from 'app/components/github/markdown/template.hbs';

export default class GithubMarkdownComponent extends BaseComponent
{
    #accountName;
    #documentInfo;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.uri)
        {
            throw new Error("github-markdown: 'uri' attribute is required.");
        }

        this.#accountName = options.account;
        this.#documentInfo = GithubMarkdownComponent.#parseDocumentUri(options.uri);
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const markdown = await this.#getDocument(refreshData);
        await this.#renderMarkdown(container, markdown);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getDocument(/* refreshData */ true);
    }

    async #renderMarkdown(container, markdown)
    {
        const data = {
            editUrl: `https://github.com/${this.#documentInfo.owner}` +
                        `/${this.#documentInfo.repo}/edit` +
                        `/${this.#documentInfo.branch}` +
                        `/${this.#documentInfo.directory}${this.#documentInfo.filename}`,
            html: marked.parse(
                markdown,
                {
                    baseUrl: `https://github.com/${this.#documentInfo.owner}` +
                                `/${this.#documentInfo.repo}/blob` +
                                `/${this.#documentInfo.branch}` +
                                `/${this.#documentInfo.directory}`,
                }),
        };
        
        container.innerHTML = template(data);
    }

    async #getDocument(refreshData)
    {
        return await this._services.cache.instance.get(
            "markdown",
            async () =>
            {
                const accessToken = await Github.getPersonalAccessToken(this._services.storage, this.#accountName);

                return await GithubMarkdownComponent.#fetchDocument(
                    this.#documentInfo, accessToken);
            },
            refreshData);
    }

    static async #fetchDocument(documentInfo, accessToken)
    {
        Argument.notNullOrUndefined(documentInfo, "documentInfo");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://api.github.com` +
                `/repos/${documentInfo.owner}/${documentInfo.repo}` +
                `/contents/${documentInfo.directory}${documentInfo.filename}` +
                `?ref=${documentInfo.branch}`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw",
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        
        return await response.text();
    }

    static #parseDocumentUri(uri)
    {
        const documentUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<branch>[^\/]+)\/(?<directory>.*?)(?<filename>[^/]+)$/i;
        const match = documentUriRegex.exec(uri);
        if (!match)
        {
            throw new Error("Document URI is in unexpected format.");
        }

        const { owner, repo, branch, directory, filename } = match.groups;

        return { owner, repo, branch, directory, filename };
    }
}