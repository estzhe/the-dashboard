import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import "/lib/date.js";

export default class AsanaComponent extends BaseComponent
{
    #title;
    #accountName;
    #projectId;
    #sectionRecentlyAssigned;
    #sectionToday;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.account)
        {
            throw new Error("asana: 'account' attribute is required.");
        }

        if (!options.projectId)
        {
            throw new Error("asana: 'project-id' attribute is required.");
        }

        if (!options.sectionRecentlyAssigned)
        {
            throw new Error("asana: 'section-recently-assigned' attribute is required.");
        }

        if (!options.sectionToday)
        {
            throw new Error("asana: 'section-today' attribute is required.");
        }

        this.#title = options.title;
        this.#accountName = options.account;
        this.#projectId = options.projectId;
        this.#sectionRecentlyAssigned = options.sectionRecentlyAssigned;
        this.#sectionToday = options.sectionToday;
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const tasks = await this.#getTasks(refreshData);
        await this.#renderTasks(container, tasks);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getTasks(/* refreshData */ true);
    }

    async #renderTasks(container, tasks)
    {
        tasks = tasks.map(task =>
                {
                    if (task.due_on)
                    {
                        const parts = task.due_on.split(/\D/);
                        parts[1] = parts[1] - 1;    // month

                        const due = new Date(...parts);
                        
                        task.due_on = due;
                        task.is_past_due = due < Date.today();
                        task.is_due_today = due.startOfDay().getDate() === Date.today().getDate();
                    }

                    return task;
                });

        const data = {
            title: this.#title,
            projectId: this.#projectId,
            tasks,
        };

        container.innerHTML = await this._template("template", data);
    }

    async #getTasks(refreshData)
    {
        return await this._services.cache.get(
            "tasks",
            async() =>
            {
                const accessToken = AsanaComponent.#getPersonalAccessToken(this.#accountName);
                
                const sections = await AsanaComponent.#fetchSections(this.#projectId, accessToken);
                
                const sectionRecentlyAssigned = sections.find(
                    s => s.name.localeCompare(this.#sectionRecentlyAssigned, undefined, { sensitivity: "accent" }) === 0 );
                if (sectionRecentlyAssigned === undefined)
                {
                    throw new Error(
                        `asana: no section for recently assigned tasks found ` +
                        `with name '${this.#sectionRecentlyAssigned}'.`);
                }

                const sectionToday = sections.find(
                    s => s.name.localeCompare(this.#sectionToday, undefined, { sensitivity: "accent" }) === 0 );
                if (sectionToday === undefined)
                {
                    throw new Error(
                        `asana: no section for today's tasks found ` +
                        `with name '${this.#sectionToday}'.`);
                }

                const tasksRecentlyAssigned = await AsanaComponent.#fetchSectionTasks(sectionRecentlyAssigned.gid, accessToken);
                tasksRecentlyAssigned.forEach(t => t.section = "recently-assigned");

                const tasksToday = await AsanaComponent.#fetchSectionTasks(sectionToday.gid, accessToken);
                tasksToday.forEach(t => t.section = "today");

                return [].concat(
                    tasksRecentlyAssigned,
                    tasksToday);
            },
            refreshData);
    }

    static async #fetchSections(projectId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(projectId, "projectId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://app.asana.com/api/1.0/projects/${projectId}/sections?opt_pretty`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());

        return response.data;
    }

    static async #fetchSectionTasks(sectionId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(sectionId, "sectionId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://app.asana.com/api/1.0/sections/${sectionId}/tasks` +
                `?limit=100` +
                `&opt_pretty` +
                `&completed_since=now` +
                `&opt_fields=name,resource_type,completed,due_on,notes`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());

        return response.data;
    }

    static #getPersonalAccessToken(accountName)
    {
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `asana.accounts.${accountName}`;

        let token = localStorage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for Asana account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            localStorage.setItem(key, token);
        }

        return token;
    }
}