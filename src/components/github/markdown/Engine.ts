import Github from 'app/components/github/Github.js';
import Options from "app/components/github/markdown/Options.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";
import FileInfo from "app/components/github/client/FileInfo.js";
import GithubClient from "app/components/github/client/GithubClient.js";

export default class Engine extends BaseComponentEngine
{
    public readonly accountName: string;
    public readonly file: FileInfo;

    public constructor(
        pathToComponent: string,
        options: Options,
        services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.uri)
        {
            throw new Error("github-markdown: 'uri' attribute is required.");
        }

        this.accountName = options.account;
        this.file = this.parseFileUri(options.uri);
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getFileContent(/* refreshData */ true);
    }

    public async getFileContent(refreshData: boolean): Promise<string>
    {
        return await this.services.cache.instance.get(
            "markdown",
            async () =>
            {
                return await this.useClient(c => c.fetchFileContent(this.file));
            },
            refreshData);
    }

    private parseFileUri(uri: string): FileInfo
    {
        const regex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<branch>[^\/]+)\/(?<directory>.*?)(?<filename>[^/]+)$/i;
        const match = regex.exec(uri);
        if (!match)
        {
            throw new Error("Document URI is in unexpected format.");
        }

        return {
            repository: {
                owner: match.groups!.owner!,
                name: match.groups!.repo!,
            },
            branch: match.groups!.branch!,
            directory: match.groups!.directory!,
            filename: match.groups!.filename!,
        };
    }

    private async useClient<T>(call: (client: GithubClient) => Promise<T>): Promise<T>
    {
        const accessToken = await Github.getPersonalAccessToken(this.services.storage, this.accountName);
        const client = new GithubClient(accessToken);

        return await call(client);
    }
}