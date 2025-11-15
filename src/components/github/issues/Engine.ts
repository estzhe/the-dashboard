import Github from 'app/components/github/Github.js';
import GithubClient from "app/components/github/client/GithubClient.js";
import Repository from "app/components/github/client/Repository.js";
import Options from "app/components/github/issues/Options.js";
import Issue from "app/components/github/client/Issue.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";
import IssueFilter from "app/components/github/issues/IssueFilter.js";
import IssueCommment from "app/components/github/client/IssueComment.js";
import LabelList from "app/components/github/issues/label-list";
import {Temporal} from "@js-temporal/polyfill";

export default class Engine extends BaseComponentEngine
{
    public readonly accountName: string;
    public readonly repository: Repository;
    public readonly title: string | undefined;
    public readonly filter: IssueFilter;
    public readonly newIssueLabels: string[];

    public constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.account)
        {
            throw new Error("github-issues: 'account' attribute is required.");
        }
        if (!options.repo)
        {
            throw new Error("github-issues: 'repo' attribute is required.");
        }

        this.accountName = options.account;
        this.repository = Repository.fromUri(options.repo);
        this.title = options.title;
        this.filter = options.filter ? new IssueFilter(options.filter) : IssueFilter.any;
        this.newIssueLabels = options.newIssueLabels ? LabelList.parse(options.newIssueLabels) : [];
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getIssues(/*refreshData*/ true);
    }

    public async getIssues(refreshData: boolean): Promise<Issue[]>
    {
        return await this.services.cache.component.get(
            `${this.repository.owner}.${this.repository.name}.issues`,
            async () =>
            {
                const accessToken = await Github.getPersonalAccessToken(this.services.storage, this.accountName);
                const client = new GithubClient(accessToken);

                return await client.fetchIssues(this.repository);
            },
            refreshData);
    }
    
    public async getIssueComments(issueNumber: number): Promise<IssueCommment[]>
    {
        return await this.useClient(c => c.fetchIssueComments(this.repository, issueNumber));
    }
    
    public async setIssueDueDate(date: Temporal.PlainDate | undefined, issueNumber: number): Promise<void>
    {
        const issue = await this.useClient(c => c.fetchIssue(this.repository, issueNumber));

        let newLabels = issue.labels
            .map(l => l.name)
            .filter(l => !l.startsWith("due:"));
        if (date !== undefined)
        {
            newLabels = newLabels.concat([`due: ${date.toString()}`]);
        }
        issue.labels = await this.useClient(c => c.setIssueLabels(this.repository, issueNumber, newLabels));

        await this.updateIssueInCache(issue);

        void this.services.messaging.send({
            audience: "component",
            kind: "cache-updated"
        });
    }

    private async updateIssueInCache(issue: Issue): Promise<void>
    {
        await this.services.cache.component.update<Issue[]>(
            `${this.repository.owner}.${this.repository.name}.issues`,
            issues => {
                const index = issues.findIndex(i => i.number === issue.number);
                if (index !== -1)
                {
                    issues[index] = issue;
                }
                else
                {
                    issues.push(issue);
                }

                return issues;
            }
        )
    }
    
    private async useClient<T>(call: (client: GithubClient) => Promise<T>): Promise<T>
    {
        const accessToken = await Github.getPersonalAccessToken(this.services.storage, this.accountName);
        const client = new GithubClient(accessToken);
        
        return await call(client);
    }
}
