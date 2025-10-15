import Argument from "app/lib/argument.js";

export default class GithubClient
{
    /**
     * @type string
     */
    #accessToken;
    
    /**
     * @param accessToken string
     */
    constructor(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.#accessToken = accessToken;
    }

    /**
     * @param owner string
     * @param repo string
     * @param issueNumber integer
     * @returns {Promise<*>}
     */
    async fetchIssue(owner, repo, issueNumber)
    {
        Argument.notNullOrUndefinedOrEmpty(owner, "owner");
        Argument.notNullOrUndefinedOrEmpty(repo, "repo");
        Argument.isNumber(issueNumber, "issueNumber");

        let response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${this.#accessToken}`
                }
            });

        return await response.json();
    }

    /**
     * @param owner string
     * @param repo string
     * @returns {Promise<*[]>}
     */
    async fetchIssues(owner, repo)
    {
        Argument.notNullOrUndefinedOrEmpty(owner, "owner");
        Argument.notNullOrUndefinedOrEmpty(repo, "repo");

        const MAX_ISSIES_PER_PAGE = 100;

        const issues = [];

        let page = 1;
        let issuesOnPage;
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues` +
                `?state=open` +
                `&per_page=${MAX_ISSIES_PER_PAGE}` +
                `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${this.#accessToken}`
                    }
                });

            issuesOnPage = await response.json();
            issues.push(...issuesOnPage);

            page++;
        }
        while (issuesOnPage.length >= MAX_ISSIES_PER_PAGE);

        return issues;
    }

    /**
     * @param owner string
     * @param repo string
     * @param issueNumber Number
     * @returns {Promise<*[]>}
     */
    async fetchIssueComments(owner, repo, issueNumber)
    {
        Argument.notNullOrUndefinedOrEmpty(owner, "owner");
        Argument.notNullOrUndefinedOrEmpty(repo, "repo");
        Argument.isNumber(issueNumber, "issueNumber");

        const MAX_COMMENTS_PER_PAGE = 100;

        const comments = [];

        let page = 1;
        let commentsOnPage;
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments` +
                `?per_page=${MAX_COMMENTS_PER_PAGE}` +
                `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${this.#accessToken}`
                    }
                });

            commentsOnPage = await response.json();
            comments.push(...commentsOnPage);

            page++;
        }
        while (commentsOnPage.length >= MAX_COMMENTS_PER_PAGE);

        return comments;
    }

    /**
     * @param owner string
     * @param repo string
     * @param issueNumber Number
     * @param labels string[]
     * @returns {Promise<void>}
     */
    async setIssueLabels(owner, repo, issueNumber, labels)
    {
        Argument.notNullOrUndefinedOrEmpty(owner, "owner");
        Argument.notNullOrUndefinedOrEmpty(repo, "repo");
        Argument.isNumber(issueNumber, "issueNumber");
        Argument.notNullOrUndefined(labels, "labels");

        let response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
            {
                method: "PUT",
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${this.#accessToken}`
                },
                body: JSON.stringify({
                    labels,
                }),
            });
        
        if (!response.ok)
        {
            throw new Error(`Issue label update failed: ${response.status} ${response.statusText}`)
        }
    }
}