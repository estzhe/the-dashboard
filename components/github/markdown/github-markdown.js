import Github from '/components/github/github.js';
import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';

export default class GithubMarkdownComponent extends BaseComponent
{
    #accountName;
    #documentInfo;

    constructor(root, container)
    {
        super(root, container);

        const accountName = container.getAttribute("account");
        const documentUri = container.getAttribute("uri");
        if (!documentUri)
        {
            throw new Error("github-markdown: 'uri' attribute is required.");
        }

        this.#accountName = accountName;
        this.#documentInfo = GithubMarkdownComponent.#parseDocumentUri(documentUri);
    }

    async render(refresh)
    {
        const markdown = await this._services.cache.get(
            "markdown",
            async () =>
            {
                const accessToken = Github.getPersonalAccessToken(this.#accountName);

                return await GithubMarkdownComponent.#fetchDocument(
                    this.#documentInfo, accessToken);
            },
            refresh);

        await this.#renderMarkdown(markdown);
    }

    async #renderMarkdown(markdown)
    {
        const data = {
            editUrl: `https://github.com/${this.#documentInfo.owner}` +
                        `/${this.#documentInfo.repo}/edit` +
                        `/${this.#documentInfo.branch}` +
                        `/${this.#documentInfo.path}`,
            html: marked(markdown),
        };
        
        this._container.innerHTML = await this._template("template", data);
    }

    static async #fetchDocument(documentInfo, accessToken)
    {
        Argument.notNullOrUndefined(documentInfo, "documentInfo");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://api.github.com` +
                `/repos/${documentInfo.owner}/${documentInfo.repo}` +
                `/contents/${documentInfo.path}` +
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