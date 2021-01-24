import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import "/lib/date.js";

export default class AsanaComponent extends BaseComponent
{
    #title;
    #accountName;
    #listId;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.account)
        {
            throw new Error("asana: 'account' attribute is required.");
        }

        if (!options.listId)
        {
            throw new Error("asana: 'list-id' attribute is required.");
        }

        this.#title = options.title;
        this.#accountName = options.account;
        this.#listId = options.listId;
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
        tasks = [].concat(
                    tasks.filter(t => t.assignee_status === "today"),
                    tasks.filter(t => t.assignee_status === "inbox"))
                .map(task =>
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
            listId: this.#listId,
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
                return await AsanaComponent.#fetchTasks(this.#listId, accessToken);
            },
            refreshData);
    }

    static async #fetchTasks(listId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(listId, "listId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://app.asana.com/api/1.0/user_task_lists/${listId}/tasks` +
                `?limit=100` +
                `&opt_pretty` +
                `&completed_since=now` +
                `&opt_fields=name,resource_type,completed,assignee_status,due_on,notes`,
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