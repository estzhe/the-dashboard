import DashboardServices from "app/dashboard/DashboardServices.js";
import Argument from 'app/lib/Argument.js';
import Options from "app/components/asana/Options.js";
import AsanaClient from "app/components/asana/client/AsanaClient.js";
import Task from "app/components/asana/client/Task.js";
import Section from "app/components/asana/client/Section.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title: string|undefined;
    public readonly accountName: string;
    public readonly projectId: string;
    public readonly sectionRecentlyAssigned: string|undefined;
    public readonly sectionToday: string|undefined;
    
    constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.account)
        {
            throw new Error("asana: 'account' attribute is required.");
        }

        if (!options.projectId)
        {
            throw new Error("asana: 'project-id' attribute is required.");
        }

        if (!options.sectionRecentlyAssigned && !options.sectionToday)
        {
            throw new Error("asana: at least one of 'section-recently-assigned' and 'section-today' attributes is required.");
        }

        this.title = options.title;
        this.accountName = options.account;
        this.projectId = options.projectId;
        this.sectionRecentlyAssigned = options.sectionRecentlyAssigned;
        this.sectionToday = options.sectionToday;
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getSectionsWithTasks(/*refreshData*/ true);
    }
    
    public async getSectionsWithTasks(refreshData: boolean): Promise<{section: Section, tasks: Task[]}[]>
    {
        return await this.services.cache.instance.get(
            "tasks",
            async() =>
            {
                const targetSectionNames =
                    [this.sectionRecentlyAssigned, this.sectionToday]
                    .filter(s => s !== undefined);
                
                const accessToken: string = await this.getPersonalAccessToken(this.accountName);
                const client = new AsanaClient(accessToken);
                
                const sections: Section[] = await client.fetchSections(this.projectId);

                return await Promise.all(
                    targetSectionNames.map(async targetSectionName =>
                    {
                        const section = sections.find(
                            s => s.name.localeCompare(targetSectionName, undefined, { sensitivity: "accent" }) === 0 );
                        if (section === undefined)
                        {
                            throw new Error(`asana: no section found with name '${targetSectionName}'.`);
                        }
    
                        const tasks = await client.fetchSectionTasks(section.gid);
                        return { section, tasks };
                    }));
            },
            refreshData);
    }
    
    public async markTaskCompleted(taskId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(taskId, "taskId");
        
        const accessToken: string = await this.getPersonalAccessToken(this.accountName);
        const client = new AsanaClient(accessToken);

        await client.markTaskCompleted(taskId);
    }

    public async getPersonalAccessToken(accountName: string): Promise<string>
    {
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");

        const key = `asana.accounts.${accountName}`;

        let token = await this.services.storage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for Asana account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            await this.services.storage.setItem(key, token);
        }

        return token;
    }
}