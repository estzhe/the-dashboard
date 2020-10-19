import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';

export default class AsanaComponent extends BaseComponent
{
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

        this.#accountName = accountName;
        this.#listId = listId;
    }

    static get name() { return "asana"; }

    async render()
    {
        const accessToken = AsanaComponent.#getPersonalAccessToken(this.#accountName);
        const tasks = await AsanaComponent.#fetchTasks(this.#listId, accessToken);

        const data = {
            listId: this.#listId,
            tasks: {
                inbox: tasks.filter(t => t.assignee_status === "inbox"),
                today: tasks.filter(t => t.assignee_status === "today"),
                upcoming: tasks.filter(t => t.assignee_status === "upcoming"),
            }
        };
        console.log(tasks);

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