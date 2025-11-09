import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";
import Charts from 'app/components/goal/Charts.js';
import { Temporal } from '@js-temporal/polyfill';
import PlainDate = Temporal.PlainDate;
import SingleDaySuccessRateWithBasis from "app/components/goal/binary-tracker/SingleDaySuccessRateWithBasis.js";
import SingleDayValueView from "app/components/goal/binary-tracker/SingleDayValueView.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/goal/binary-tracker/Engine.js";
import template from 'app/components/goal/binary-tracker/templates/template.hbs';
import historyEditorTemplate from 'app/components/goal/binary-tracker/templates/history-editor.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const today: PlainDate = Temporal.Now.plainDateISO();
        const yesterday: PlainDate = Temporal.Now.plainDateISO().subtract({ days: 1 });

        // There is an important difference between undefined and null here:
        //  - undefined means a value for this date has not been set explicitly
        //  - null means a value for this date has been explicitly set to be ignored
        //    (thus, for null we consider that a day has an entry)
        const hasEntryForToday: boolean = await this.engine.getValue(today) !== undefined;

        const successRates = await this.engine.getSuccessRatesUntilDate(
            hasEntryForToday ? today : yesterday,
            this.engine.visibleWindowDays,
            this.engine.trackingWindowDays,
            /* includeDaysWithoutValue */ !this.engine.ignoreSkippedDays);
        const currentSuccessRateEntry = successRates.length > 0
            ? successRates.reduce((a, b) => PlainDate.compare(a.date, b.date) > 0 ? a : b)
            : null;

        const data = {
            title: this.engine.title,
            currentCalculatedValue: currentSuccessRateEntry !== null
                ? currentSuccessRateEntry.value.toFixed(this.engine.precision) + this.engine.unit
                : null,
            currentCalculatedValueBasis: currentSuccessRateEntry !== null
                ? {
                    successCount: currentSuccessRateEntry.basis.successCount,
                    failureCount: currentSuccessRateEntry.basis.daysAttempted - currentSuccessRateEntry.basis.successCount,
                }
                : null,
            needTodaysEntry: !hasEntryForToday,
            ignoreSkippedDays: this.engine.ignoreSkippedDays,
        };
        this.container.innerHTML = template(data);

        if (!hasEntryForToday)
        {
            await this.renderTodaysEntryEditor();
        }
        await this.renderHistoryEditor();
        await this.renderChart(successRates);
    }
    
    private async renderTodaysEntryEditor(): Promise<void>
    {
        const todaysEntryContainer = this.container.querySelector<HTMLElement>(".todays-entry")!;
        todaysEntryContainer.addEventListener("click", e => this.onTodaysEntryClick(e));
    }

    private async renderHistoryEditor(): Promise<void>
    {
        const currentValueElement = this.container.querySelector<HTMLElement>(".current-value")!;
        currentValueElement.addEventListener("click", async e => await this.onCurrentValueClick(e));

        const dialog = this.container.querySelector<HTMLDialogElement>(".history-editor")!;
        dialog.addEventListener("close", async e => await this.onHistoryEditorDialogClose(e));
    }
    
    private async renderChart(successRates: SingleDaySuccessRateWithBasis[]): Promise<void>
    {
        const chartElement = this.container.querySelector<HTMLElement>(".chart")!;
        Charts.renderLineChart(
            chartElement,
            this.engine.width,
            this.engine.height,
            this.engine.yMin,
            this.engine.yMax,
            this.engine.goal,
            "Rate",
            `.${this.engine.precision}f`,
            successRates);
    }

    private async onTodaysEntryClick(e: MouseEvent): Promise<void>
    {
        const targetElement = e.target as HTMLElement;
        if (targetElement.nodeName !== "A") return;

        e.preventDefault();

        const today: PlainDate = Temporal.Now.plainDateISO();
        const value =
            targetElement.dataset.value === "true" ? true :
            targetElement.dataset.value === "false" ? false :
            null;

        await this.engine.setValue(today, value);

        await this.render(/*refreshData*/ false);
    }

    private async onCurrentValueClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const today: PlainDate = Temporal.Now.plainDateISO();
        const singleDayValues =
            (await this.engine.getSingleDayValuesUntilDate(today, /*includeDaysWithoutValue*/ true))
            .sort((a, b) => PlainDate.compare(a.date, b.date) > 0 ? -1 : 1);
        const singleDayValueViews = this.toSingleDayValueViews(singleDayValues);

        const data = {
            entries: singleDayValueViews,
            ignoreSkippedDays: this.engine.ignoreSkippedDays,
        };

        const dialog = this.container.querySelector<HTMLDialogElement>(".history-editor")!;
        dialog.innerHTML = historyEditorTemplate(data);

        const editableElementsContainer = dialog.querySelector<HTMLElement>(".editable-elements-container")!;
        editableElementsContainer.addEventListener("change",
            async e => await this.onHistoryEditorInputChange(e));

        dialog.dataset.haveValuesChanged = "false";
        dialog.showModal();
    }

    private async onHistoryEditorInputChange(e: Event): Promise<void>
    {
        const targetElement = e.target as HTMLInputElement;
        if (!targetElement.classList.contains("editable-element"))
        {
            return;
        }

        e.preventDefault();

        const date = PlainDate.from(targetElement.closest<HTMLElement>("[data-date]")!.dataset.date!);
        const value =
            targetElement.value === "true" ? true :
            targetElement.value === "false" ? false :
            targetElement.value === "null" ? null :
            targetElement.checked;

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

    private toSingleDayValueViews(singleDayValues: SingleDayValue<boolean|null|undefined>[])
        : SingleDayValueView<boolean|null|undefined>[]
    {
        const singleDayValueViews =
            singleDayValues.map(v => v as SingleDayValueView<boolean|null|undefined>);

        if (singleDayValueViews.length >= this.engine.trackingWindowDays)
        {
            if (this.engine.ignoreSkippedDays)
            {
                for (let i = 0, trackedCount = 0; i < singleDayValueViews.length; ++i)
                {
                    if (singleDayValueViews[i]!.value !== null &&
                        singleDayValueViews[i]!.value !== undefined)
                    {
                        trackedCount++;
                    }

                    if (trackedCount === this.engine.trackingWindowDays)
                    {
                        singleDayValueViews[i]!.isLastTrackedEntry = true;
                        break;
                    }
                }
            }
            else
            {
                singleDayValueViews[this.engine.trackingWindowDays - 1]!.isLastTrackedEntry = true;
            }
        }

        return singleDayValueViews;
    }
}
