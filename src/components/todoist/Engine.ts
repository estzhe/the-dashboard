import Argument from 'app/lib/Argument.js';
import Options from "app/components/todoist/Options.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import TodoistClient from "app/components/todoist/client/TodoistClient.js";
import IStorage from "app/lib/IStorage.js";
import Task from "app/components/todoist/client/Task.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title?: string;
    public readonly accountName: string;
    public readonly filter: string;
    
    constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.account)
        {
            throw new Error("todoist: 'account' attribute is required.");
        }

        if (!options.filter)
        {
            throw new Error("todoist: 'filter' attribute is required.");
        } 

        this.title = options.title;
        this.accountName = options.account;
        this.filter = options.filter;
    }
    
    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getTasks(/* refreshData */ true);
    }
    
    public async getTasks(refreshData: boolean): Promise<Task[]>
    {
        return await this.services.cache.instance.get(
            "tasks",
            async() =>
            {
                const client = await this.getClient();
                return await client.fetchTasks(this.filter);
            },
            refreshData);
    }
    
    public async markTaskCompleted(taskId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(taskId, "taskId");
        
        const client = await this.getClient();
        await client.markTaskCompleted(taskId);
    }

    private async getClient(): Promise<TodoistClient>
    {
        const accessToken: string = await Engine.getPersonalAccessToken(
            this.services.storage, this.accountName);
        return new TodoistClient(accessToken);
    }

    private static async getPersonalAccessToken(storage: IStorage, accountName: string): Promise<string>
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");

        const key = `todoist.accounts.${accountName}`;

        let token = await storage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for Todoist account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            await storage.setItem(key, token);
        }

        return token;
    }
}