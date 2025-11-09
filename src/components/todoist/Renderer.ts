import { Temporal } from '@js-temporal/polyfill';
import Task from "app/components/todoist/client/Task.js";
import TaskView from "app/components/todoist/TaskView.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/todoist/Engine.js";
import template from 'app/components/todoist/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const tasks: Task[] = await this.engine.getTasks(refreshData);
        console.log(tasks);
        const taskViews: TaskView[] = tasks
            .map(t => this.toTaskView(t))
            .sort((t1, t2) =>
            {
                let d = (t1.due?.is_past_due ? -1 : 0) - (t2.due?.is_past_due ? -1 : 0);
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
        console.log(taskViews);

        const data = {
            title: this.engine.title,
            titleUri: this.engine.filter.includes("today")
                ? "https://app.todoist.com/app/today"
                : `https://app.todoist.com/app/search/${encodeURIComponent(this.engine.filter)}`,
            tasks: taskViews,
        };
        this.container.innerHTML = template(data);

        const doneButtons = this.container.querySelectorAll<HTMLElement>(".done-button");
        doneButtons.forEach(button => button.addEventListener("click", e => this.onDoneButtonClick(e)));
    }
    
    private async onDoneButtonClick(e: MouseEvent): Promise<void>
    {
        const targetButton = e.target as HTMLElement;
        const itemElement = targetButton.closest<HTMLElement>(".item")!;
        
        const taskId = itemElement.dataset.taskId!;
        await this.engine.markTaskCompleted(taskId);

        await this.render(/*refreshData*/ true);
    }

    private toTaskView(task: Task): TaskView
    {
        const dueDate = task.due?.date ? Temporal.PlainDate.from(task.due.date) : undefined;

        return {
            id: task.id,
            description: task.description,
            content: task.content,
            due: dueDate
                ? {
                    date: Temporal.PlainDate.from(dueDate),
                    is_past_due: Temporal.PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) < 0,
                    is_due_today: Temporal.PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) === 0,
                }
                : undefined,
            day_order: task.day_order,
            child_order: task.child_order,
        };
    }
}