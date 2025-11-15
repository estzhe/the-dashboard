import { Temporal, Intl } from "@js-temporal/polyfill";
import PlainDate = Temporal.PlainDate;
import { marked } from 'marked';
import Issue from "app/components/github/client/Issue.js";
import IssueView from "app/components/github/issues/IssueView.js";
import ComponentMessage from "app/dashboard/ComponentMessage.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/github/issues/Engine.js";
import template from 'app/components/github/issues/templates/template.hbs';
import issuePreviewTemplate from 'app/components/github/issues/templates/issue-preview.hbs';
import dueDateSelectorTemplate from 'app/components/github/issues/templates/due-date-selector.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        let issues = await this.engine.getIssues(refreshData);
        issues = this.engine.filter.apply(issues)
            .sort((i1, i2) => i2.updated_at.localeCompare(i1.updated_at));  // recent first

        const issueViews = this.toIssueViews(issues);
        const data = {
            title: this.engine.title,
            url: `https://github.com/${this.engine.repository.owner}/${this.engine.repository.name}` +
                    `/issues?q=${encodeURIComponent(this.engine.filter.toFilterQuery())}`,
            issues: issueViews,
        };
        this.container.innerHTML = template(data);

        const titleElement = this.container.querySelector<HTMLElement>(".issues-title");
        titleElement?.addEventListener("click", e => this.onTitleClick(e));

        this.renderIssuePreviewer(issues);
        this.renderScheduleSelector(issues);
    }

    public override async onMessage(message: ComponentMessage): Promise<void>
    {
        await super.onMessage(message);

        if (message.kind === "cache-updated")
        {
            await this.render(/*refreshData*/ false);
        }
    }

    private renderIssuePreviewer(issues: IssueView[])
    {
        this.container.querySelectorAll<HTMLElement>(".item")
            .forEach(
                item => item.addEventListener("click", e => this.onIssueClick(e, issues)));
    }

    private renderScheduleSelector(issues: IssueView[])
    {
        this.container.querySelectorAll<HTMLElement>(".schedule-button")
            .forEach(button =>
                button.addEventListener("click", e => this.onScheduleButtonClick(e, issues)));
        
        const popoverElement = this.container.querySelector<HTMLElement>(".schedule-popover")!;
        popoverElement.addEventListener("toggle", e => this.onSchedulePopoverToggle(e, this.container));
    }

    private onTitleClick(e: MouseEvent): void
    {
        if (e.altKey)
        {
            e.preventDefault();
            e.stopPropagation();

            let newIssueUri = `https://github.com/${this.engine.repository.owner}/${this.engine.repository.name}/issues/new`;
            if (this.engine.newIssueLabels.length > 0)
            {
                newIssueUri += "?labels=" + encodeURIComponent(this.engine.newIssueLabels.map(l => `"${l}"`).join(","));
            }

            window.open(newIssueUri, "_blank")!.focus();
        }
    }

    private async onIssueClick(e: MouseEvent, issues: IssueView[]): Promise<void>
    {
        if (e.ctrlKey || e.shiftKey) return;

        e.preventDefault();
        e.stopPropagation();

        const itemElement = (e.target! as HTMLElement).closest<HTMLElement>(".item")!;

        const issueId = Number(itemElement.dataset.issueId);
        const issue = issues.find(x => x.id === issueId)!;
        const comments = await this.engine.getIssueComments(issue.number);

        const data = {
            issue,
            bodyHtml: marked(issue.body ?? "", { breaks: true }),
            comments: comments.map(c => ({
                bodyHtml: marked(c.body ?? "", { breaks: true})
            })),
        };

        const dialogElement = this.container.querySelector<HTMLDialogElement>("dialog.issue-viewer")!;
        dialogElement.innerHTML = issuePreviewTemplate(data);
        dialogElement.showModal();
    }

    private onScheduleButtonClick(e: MouseEvent, issues: IssueView[])
    {
        e.preventDefault();
        e.stopPropagation();

        const itemElement = (e.target! as HTMLElement).closest<HTMLElement>(".item")!;

        const issueId: number = Number(itemElement.dataset.issueId);
        const issue: IssueView = issues.find(x => x.id === issueId)!;

        const today: PlainDate = Temporal.Now.plainDateISO();
        const tomorrow: PlainDate = today.add({ days: 1 });
        const weekdays: any[] = [];
        const firstDayOfCurrentWeek: PlainDate = today.subtract({ days: today.dayOfWeek - 1 });
        const format = new Intl.DateTimeFormat('en-US', { weekday: "narrow" });
        for (
            let date: PlainDate = firstDayOfCurrentWeek;
            date.since(firstDayOfCurrentWeek).days < 14;
            date = date.add({ days: 1 }))
        {
            weekdays.push({
                title: format.format(date),
                isToday: date.equals(today),
                isSelected: issue.due && date.equals(issue.due.date),
                date: date.toString(),
            });
        }

        const popoverElement = this.container.querySelector<HTMLElement>(".schedule-popover")!;
        popoverElement.dataset.issueId = String(issueId);
        popoverElement.dataset.issueNumber = String(issue.number);
        popoverElement.innerHTML = dueDateSelectorTemplate({
            weekdays,
            isTodaySelected: issue.due?.date.equals(today) === true,
            isTomorrowSelected: issue.due?.date.equals(tomorrow) === true,
            selectedDateIso8601: issue.due?.date.toString() ?? "",
            dateToday: today.toString(),
            dateTomorrow: tomorrow.toString(),
        });

        const selectDateButtons = popoverElement.querySelectorAll<HTMLElement>("[data-date]");
        selectDateButtons.forEach(button => button.addEventListener("click", e => this.onScheduleSelectorDateClick(e)));
        
        const dateSelector = popoverElement.querySelector<HTMLInputElement>(".choose-date-button input[type=date]")!;
        dateSelector.addEventListener("change", e => this.onScheduleSelectorDatePickerChange(e));

        // @ts-ignore - unignore once TypeScript updates its definitions
        popoverElement.showPopover({
            source: e.target,
        });
    }
    
    private async onScheduleSelectorDateClick(e: MouseEvent)
    {
        const targetElement = e.target as HTMLElement;
        const popoverElement = targetElement.closest<HTMLElement>(".schedule-popover")!;
        
        const selectedDate = targetElement.dataset.date
            ? Temporal.PlainDate.from(targetElement.dataset.date)
            : undefined;
        const issueNumber = Number(popoverElement.dataset.issueNumber!);
    
        await this.engine.setIssueDueDate(selectedDate, issueNumber);
        await this.render(/*refreshData*/ false);
    }
    
    private async onScheduleSelectorDatePickerChange(e: Event)
    {
        const targetElement = e.target as HTMLInputElement;
        const popoverElement = targetElement.closest<HTMLElement>(".schedule-popover")!;

        const selectedDate = targetElement.value
            ? Temporal.PlainDate.from(targetElement.value)
            : undefined;
        const issueNumber = Number(popoverElement.dataset.issueNumber!);
        
        await this.engine.setIssueDueDate(selectedDate, issueNumber);
        await this.render(/*refreshData*/ false);
    }

    private onSchedulePopoverToggle(e: ToggleEvent, container: HTMLElement)
    {
        const popoverElement = e.target! as HTMLElement;
        const issueId = popoverElement.dataset.issueId;

        const sourceScheduleButton = container
            .querySelector<HTMLElement>(`.item[data-issue-id='${issueId}'] .item-action:has(.schedule-button)`)!;

        if (e.newState === "open")
        {
            sourceScheduleButton.classList.add("visible");
        }
        else
        {
            sourceScheduleButton.classList.remove("visible");
        }
    }

    private toIssueViews(issues: Issue[]): IssueView[]
    {
        return (issues as IssueView[]).map(issueView =>
        {
            const dueDateLabel = issueView.labels.find(label => label.name.startsWith("due:"))?.name;
            if (dueDateLabel &&
                /due:\s*\d{4}-\d{1,2}-\d{1,2}/.test(dueDateLabel))
            {
                const dueDate = PlainDate.from(dueDateLabel.replace("due:", "").trim());
                issueView.due = {
                    date: dueDate,
                    is_past_due: PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) < 0,
                    is_due_today: PlainDate.compare(dueDate, Temporal.Now.plainDateISO()) === 0,
                };
            }

            return issueView;
        });
    }
}
