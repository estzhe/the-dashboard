import { Temporal } from '@js-temporal/polyfill';
import Task from "app/components/asana/client/Task.js";
import Section from "app/components/asana/client/Section.js";
import TaskView from "app/components/asana/TaskView.js";
import PlainDate = Temporal.PlainDate;
import Engine from "app/components/asana/Engine.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import template from 'app/components/asana/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const sectionsWithTasks = await this.engine.getSectionsWithTasks(refreshData);
        const taskViews = this.toTaskViews(sectionsWithTasks);

        const data = {
            title: this.engine.title,
            projectId: this.engine.projectId,
            tasks: taskViews,
        };
        this.container.innerHTML = template(data);

        for (const action of this.container.querySelectorAll<HTMLElement>(".done-button"))
        {
            action.addEventListener("click", async e => await this.onDoneClick(e));
        }
    }

    private async onDoneClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const targetElement = (e.target as HTMLElement)!;
        
        const taskId = targetElement.closest<HTMLElement>(".item")!.dataset.taskId!;
        await this.engine.markTaskCompleted(taskId);

        await this.render(/*refreshData*/ true);
    }
    
    private toTaskViews(sectionsWithTasks: { section: Section, tasks: Task[] }[]): TaskView[]
    {
        const taskViews: TaskView[] = [];

        for (const sectionWithTasks of sectionsWithTasks)
        {
            const isRecentlyAssigned =
                this.engine.sectionRecentlyAssigned !== undefined &&
                sectionWithTasks.section.name.localeCompare(this.engine.sectionRecentlyAssigned, undefined, { sensitivity: "accent" }) === 0;

            for (const task of sectionWithTasks.tasks)
            {
                const taskView = task as TaskView;

                taskView.isRecentlyAssigned = isRecentlyAssigned;

                if (task.due_on)
                {
                    const date = PlainDate.from(task.due_on);

                    taskView.due = {
                        date,
                        is_past_due: PlainDate.compare(date, Temporal.Now.plainDateISO()) < 0,
                        is_due_today: PlainDate.compare(date, Temporal.Now.plainDateISO()) === 0,
                    };
                }

                taskViews.push(taskView);
            }
        }

        return taskViews;
    }
}