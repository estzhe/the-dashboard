import Argument from 'app/lib/Argument.js';
import GoogleClient from "app/components/google/client/GoogleClient.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import Options from "app/components/google/mail/Options.js";
import ChromeAccessTokenProvider from "app/components/google/ChromeAccessTokenProvider.js";
import Thread from "app/components/google/client/mail/Thread.js";
import UserInfo from "app/components/google/client/UserInfo.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title?: string;
    
    private readonly client: GoogleClient;
    
    constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        this.title = options.title;
        
        this.client = new GoogleClient(new ChromeAccessTokenProvider());
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        
        await this.getUserInfo(/*refreshData*/ true);
        await this.getMailThreadsInInbox(/*refreshData*/ true);
    }

    public async getUserInfo(refreshData: boolean): Promise<UserInfo>
    {
        return await this.services.cache.instance.get(
            "userinfo",
            async () => await this.client.fetchUserInfo(),
            refreshData);
    }

    public async getMailThreadsInInbox(refreshData: boolean): Promise<Thread[]>
    {
        return await this.services.cache.instance.get(
            "emails.inbox",
            async () =>
            {
                const threads = await this.client.fetchMailThreadsInInbox();
                const threadsWithMessages = await Promise.all(
                    threads.map(thread => this.client.fetchMailThread(thread.id)));

                return threadsWithMessages;
            },
            refreshData);
    }
    
    public async archiveThread(threadId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(threadId, "threadId");
        await this.client.archiveMailThread(threadId);
    }
}
