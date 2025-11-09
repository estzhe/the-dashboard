import Argument from "app/lib/Argument.js";
import Task from "app/components/asana/client/Task.js";
import Section from "app/components/asana/client/Section.js";

export default class AsanaClient
{
    private readonly accessToken: string;

    constructor(accessToken: string)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.accessToken = accessToken;
    }
    
    public async fetchSectionTasks(sectionId: string): Promise<Task[]>
    {
        Argument.notNullOrUndefinedOrEmpty(sectionId, "sectionId");

        const response = await fetch(
            `https://app.asana.com/api/1.0/sections/${sectionId}/tasks` +
                `?limit=100` +
                `&opt_pretty` +
                `&completed_since=now` +
                `&opt_fields=name,resource_type,completed,due_on,notes`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            })
            .then(_ => _.json());

        return response.data;
    }

    public async fetchSections(projectId: string): Promise<Section[]>
    {
        Argument.notNullOrUndefinedOrEmpty(projectId, "projectId");

        const response = await fetch(
            `https://app.asana.com/api/1.0/projects/${projectId}/sections?opt_pretty`,
            {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            })
            .then(_ => _.json());

        return response.data;
    }

    public async markTaskCompleted(taskId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(taskId, "taskId");

        await fetch(
            `https://app.asana.com/api/1.0/tasks/${taskId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    data: {
                        completed: true,
                    },
                }),
            }
        )
    }
}