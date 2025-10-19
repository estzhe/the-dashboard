import Argument from 'app/lib/argument.js';
import BaseComponent from 'app/components/base-component.js';
import { Temporal } from '@js-temporal/polyfill';
import template from 'app/components/todoist/template.hbs';

export default class TodoistComponent extends BaseComponent
{
    #title;
    #accountName;
    #filter;
    
    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.account)
        {
            throw new Error("todoist: 'account' attribute is required.");
        }

        if (!options.filter)
        {
            throw new Error("todoist: 'filter' attribute is required.");
        } 

        this.#title = options.title;
        this.#accountName = options.account;
        this.#filter = options.filter;
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
        tasks = tasks
            .map(task =>
            {
                if (task.due?.date)
                {
                    const parsed = Temporal.PlainDate.from(task.due.date);
    
                    task.due.parsed = parsed;
                    task.is_past_due = Temporal.PlainDate.compare(parsed, Temporal.Now.plainDateISO()) < 0;
                    task.is_due_today = Temporal.PlainDate.compare(parsed, Temporal.Now.plainDateISO()) === 0;
                }
    
                return task;
            })
            .sort((t1, t2) =>
            {
                let d = (t1.is_past_due ? -1 : 0) - (t2.is_past_due ? -1 : 0);
                if (d !== 0)
                {
                    return d;
                }

                d = (t1.day_order ?? Number.MAX_SAFE_INTEGER) - (t2.day_order ?? Number.MAX_SAFE_INTEGER);
                if (d !== 0)
                {
                    return d;
                }
                
                return t1.child_order - t2.child_order;
            });

        const data = {
            title: this.#title,
            titleUri: this.#filter.includes("today")
                ? "https://app.todoist.com/app/today"
                : `https://app.todoist.com/app/search/${encodeURIComponent(this.#filter)}`,
            tasks,
        };

        container.innerHTML = template(data);
        
        for (const action of container.querySelectorAll(".done-button"))
        {
            action.addEventListener(
                "click",
                async e =>
                {
                    const taskId = e.target.closest(".item").dataset.taskId;
                    await this.#markTaskCompleted(taskId);

                    await this.render(container, /*refreshData*/ true);
                });
        }
    }
    
    async #getTasks(refreshData)
    {
        return await this._services.cache.instance.get(
            "tasks",
            async() =>
            {
                const accessToken = await TodoistComponent.#getPersonalAccessToken(
                    this._services.storage, this.#accountName);
                return await TodoistComponent.#fetchTasks(this.#filter, accessToken);
            },
            refreshData);
    }

    static async #fetchTasks(filter, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(filter, "filter");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://api.todoist.com/api/v1/tasks/filter?query=${encodeURIComponent(filter)}`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());

        return response.results;
    }

    async #markTaskCompleted(taskId)
    {
        Argument.notNullOrUndefinedOrEmpty(taskId, "taskId");

        const accessToken = await TodoistComponent.#getPersonalAccessToken(
            this._services.storage, this.#accountName);

        await fetch(
            `https://api.todoist.com/api/v1/tasks/${taskId}/close`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        )
    }

    static async #getPersonalAccessToken(storage, accountName)
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