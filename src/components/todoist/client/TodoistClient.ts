import Argument from "app/lib/Argument.js";
import ListResponse from "app/components/todoist/client/ListResponse.js";
import Task from "app/components/todoist/client/Task.js";

export default class TodoistClient
{
    private readonly accessToken: string;

    public constructor(accessToken: string)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.accessToken = accessToken;
    }

    public async fetchTasks(filter: string): Promise<Task[]>
    {
        Argument.notNullOrUndefinedOrEmpty(filter, "filter");

        const response = await fetch(
            `https://api.todoist.com/api/v1/tasks/filter?query=${encodeURIComponent(filter)}`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            });
        
        const payload = await response.json() as ListResponse<Task>;
        return payload.results;
    }

    public async markTaskCompleted(taskId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(taskId, "taskId");

        await fetch(
            `https://api.todoist.com/api/v1/tasks/${taskId}/close`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`,
                },
            }
        )
    }
}