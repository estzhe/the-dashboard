import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import "/lib/date.js";

export default class AsanaComponent extends BaseComponent
{
    #title;
    #accountName;
    #listId;

    constructor(root, container)
    {
        super(root, container);

        const accountName = container.getAttribute("account");
        if (!accountName)
        {
            throw new Error("asana: 'account' attribute is required.");
        }

        const listId = container.getAttribute("list-id");
        if (!listId)
        {
            throw new Error("asana: 'list-id' attribute is required.");
        }

        this.#title = container.getAttribute("title");
        this.#accountName = accountName;
        this.#listId = listId;
    }

    async render(refresh)
    {
        const tasks = await this._services.cache.get(
            "tasks",
            async() =>
            {
                const accessToken = AsanaComponent.#getPersonalAccessToken(this.#accountName);
                return await AsanaComponent.#fetchTasks(this.#listId, accessToken);
            },
            refresh);
        
        await this.#renderData(tasks);
    }

    async #renderData(tasks)
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

        this._container.innerHTML = await this._template("template", data);
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