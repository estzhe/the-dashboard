import Charts from 'app/components/goal/Charts.js';
import { Temporal } from '@js-temporal/polyfill';
import PlainDate = Temporal.PlainDate;
import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/goal/numeric-tracker/Engine.js";
import template from 'app/components/goal/numeric-tracker/templates/template.hbs';
import historyEditorTemplate from 'app/components/goal/numeric-tracker/templates/history-editor.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const today = Temporal.Now.plainDateISO();

        // There is an important difference between undefined and null here:
        //  - undefined means a value for this date has not been set explicitly
        //  - null means a value for this date has been explicitly set to be ignored
        //    (thus, for null we consider that a day has an entry)
        const hasEntryForToday = await this.engine.getValue(today) !== undefined;

        const entries: SingleDayValue<number|null|undefined>[] =
            (await this.engine.getSingleDayValuesUntilDate(today, /* includeDaysWithoutValue */ !this.engine.ignoreSkippedDays))
            .slice(-this.engine.visibleWindowDays);
        let currentEntry = entries.length > 0
            ? entries.reduce((a, b) => PlainDate.compare(a.date, b.date) > 0 ? a : b)
            : null;

        const data = {
            title: this.engine.title,
            currentValue: currentEntry?.value !== null && currentEntry?.value !== undefined
                ? currentEntry.value.toFixed(this.engine.precision) + this.engine.unit
                : null,
            needTodaysEntry: !hasEntryForToday,
        };
        this.container.innerHTML = template(data);

        if (!hasEntryForToday)
        {
            await this.renderTodaysValueEditor();
        }
        await this.renderHistoryEditor();
        await this.renderChart(entries);
    }

    private async renderTodaysValueEditor(): Promise<void>
    {
        const todaysValueSaveButton = this.container.querySelector<HTMLElement>(".todays-entry button")!;
        todaysValueSaveButton.addEventListener("click", async e => await this.onTodaysValueSaveButtonClick(e));
    }

    private async renderHistoryEditor(): Promise<void>
    {
        const currentValueElement = this.container.querySelector<HTMLElement>(".current-value")!;
        currentValueElement.addEventListener("click", async e => await this.onCurrentValueClick(e));

        const dialog = this.container.querySelector<HTMLDialogElement>(".history-editor")!;
        dialog.addEventListener("close", async e => await this.onHistoryEditorDialogClose(e));
    }

    private async renderChart(entries: SingleDayValue<number|null|undefined>[]): Promise<void>
    {
        const chartElement = this.container.querySelector<HTMLElement>(".chart")!;
        Charts.renderLineChart(
            chartElement,
            this.engine.width,
            this.engine.height,
            this.engine.yMin,
            this.engine.yMax,
            this.engine.goal,
            "Value",
            `.${this.engine.precision}f`,
            entries);
    }

    private async onTodaysValueSaveButtonClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const inputElement = this.container.querySelector<HTMLInputElement>(".todays-entry input")!;

        let value: number|null = inputElement.value === "" ? null : Number(inputElement.value);
        if (value !== null && isNaN(value) ||
            value === null && !this.engine.ignoreSkippedDays)
        {
            inputElement.style.border = "1px solid red";
            return;
        }

        const today: PlainDate = Temporal.Now.plainDateISO();
        await this.engine.setValue(today, value);

        await this.render(/*refreshData*/ false);
    }

    private async onCurrentValueClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const today: PlainDate = Temporal.Now.plainDateISO();
        const historyEntries =
            (await this.engine.getSingleDayValuesUntilDate(today, /*includeDaysWithoutValue */ true))
            .sort((a, b) => Temporal.PlainDate.compare(a.date, b.date) > 0 ? -1 : 1);

        const dialog = this.container.querySelector<HTMLDialogElement>(".history-editor")!;
        dialog.innerHTML = historyEditorTemplate({ entries: historyEntries });

        const editableElementsContainer = dialog.querySelector<HTMLElement>(".editable-elements-container")!;
        editableElementsContainer.addEventListener("change", async e => await this.onHistoryEditorInputChange(e));

        dialog.dataset.haveValuesChanged = "false";
        dialog.showModal();
    }

    private async onHistoryEditorInputChange(e: Event): Promise<void>
    {
        const targetElement = e.target as HTMLInputElement;
        if (!targetElement.classList.contains("editable-element") ||
            isNaN(Number(targetElement.value)))
        {
            return;
        }

        e.preventDefault();

        const date: PlainDate = PlainDate.from(targetElement.dataset.date!);
        const value: number|null = targetElement.value === "" ? null : Number(targetElement.value);

        await this.engine.setValue(date, value);

        const dialog = this.container.querySelector<HTMLDialogElement>(".history-editor")!;
        dialog.dataset.haveValuesChanged = "true";
    }

    private async onHistoryEditorDialogClose(e: Event): Promise<void>
    {
        const dialog = e.target as HTMLDialogElement;
        if (dialog.dataset.haveValuesChanged === "true")
        {
            await this.render(/*refreshData*/ false);
        }
    }
}