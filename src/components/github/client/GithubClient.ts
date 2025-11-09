import Argument from "app/lib/Argument.js";
import Repository from "app/components/github/client/Repository.js";
import Issue from "app/components/github/client/Issue.js";
import IssueCommment from "app/components/github/client/IssueComment.js";
import IssueLabel from "app/components/github/client/IssueLabel.js";
import FileInfo from "app/components/github/client/FileInfo.js";

export default class GithubClient
{
    private readonly accessToken: string;
    
    constructor(accessToken: string)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.accessToken = accessToken;
    }

    async fetchIssue(repository: Repository, issueNumber: number): Promise<Issue>
    {
        Argument.notNullOrUndefined(repository, "repository");
        Argument.isNumber(issueNumber, "issueNumber");

        let response = await fetch(
            `https://api.github.com/repos/${repository.owner}/${repository.name}/issues/${issueNumber}`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${this.accessToken}`
                }
            });

        return await response.json();
    }

    async fetchIssues(repository: Repository): Promise<Issue[]>
    {
        Argument.notNullOrUndefined(repository, "repository");

        const MAX_ISSIES_PER_PAGE = 100;

        const issues: Issue[] = [];

        let page = 1;
        let issuesOnPage: Issue[];
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${repository.owner}/${repository.name}/issues` +
                `?state=open` +
                `&per_page=${MAX_ISSIES_PER_PAGE}` +
                `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${this.accessToken}`
                    }
                });

            issuesOnPage = await response.json();
            issues.push(...issuesOnPage);

            page++;
        }
        while (issuesOnPage.length >= MAX_ISSIES_PER_PAGE);

        return issues;
    }

    async fetchIssueComments(repository: Repository, issueNumber: number): Promise<IssueCommment[]>
    {
        Argument.notNullOrUndefined(repository, "repository");
        Argument.isNumber(issueNumber, "issueNumber");

        const MAX_COMMENTS_PER_PAGE = 100;

        const comments: IssueCommment[] = [];

        let page = 1;
        let commentsOnPage: IssueCommment[];
        do
        {
            let response = await fetch(
                `https://api.github.com/repos/${repository.owner}/${repository.name}/issues/${issueNumber}/comments` +
                `?per_page=${MAX_COMMENTS_PER_PAGE}` +
                `&page=${page}`,
                {
                    headers: {
                        "Accept": "application/vnd.github.v3.raw+json",
                        "Authorization": `Bearer ${this.accessToken}`
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
     * Replaces issue labels with new ones. Returns new issue labels.
     */
    async setIssueLabels(repository: Repository, issueNumber: number, labels: string[]): Promise<IssueLabel[]>
    {
        Argument.notNullOrUndefined(repository, "repository");
        Argument.isNumber(issueNumber, "issueNumber");
        Argument.notNullOrUndefined(labels, "labels");

        let response = await fetch(
            `https://api.github.com/repos/${repository.owner}/${repository.name}/issues/${issueNumber}/labels`,
            {
                method: "PUT",
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    labels,
                }),
            });
        
        if (!response.ok)
        {
            throw new Error(`Issue label update failed: ${response.status} ${response.statusText}`)
        }
        
        return await response.json();
    }
    
    async fetchFileContent(file: FileInfo): Promise<string>
    {
        Argument.notNullOrUndefined(file, "file");

        const response = await fetch(
            `https://api.github.com` +
            `/repos/${file.repository.owner}/${file.repository.name}` +
            `/contents/${file.directory}${file.filename}` +
            `?ref=${file.branch}`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw",
                    "Authorization": `Bearer ${this.accessToken}`
                }
            });

        return await response.text();
    }
}