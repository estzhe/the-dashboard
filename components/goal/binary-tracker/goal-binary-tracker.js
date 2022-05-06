import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import Charts from '/components/goal/charts.js';
import GoalTrackerStore from '/components/goal/goal-tracker-store.js';
import { Temporal } from '@js-temporal/polyfill';

export default class GoalBinaryTrackerComponent extends BaseComponent
{
    #title;
    #unit;
    #precision;
    #height;
    #yMin;
    #yMax;
    #goal;
    #trackingWindowDays;
    #visibleWindowDays;
    #ignoreSkippedDays;

    /**
     * @type GoalTrackerStore<boolean>
     */
    #store;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.yMin)
        {
            throw new Error("goal/binary-tracker: 'yMin' attribute is required.");
        }

        if (!options.yMax)
        {
            throw new Error("goal/binary-tracker: 'yMax' attribute is required.");
        }
        
        if (!options.trackingWindowDays)
        {
            throw new Error("goal/binary-tracker: 'trackingWindowDays' attribute is required.");
        }

        if (!options.visibleWindowDays)
        {
            throw new Error("goal/binary-tracker: 'visibleWindowDays' attribute is required.");
        }

        this.#title = options.title;
        this.#unit = options.unit;
        this.#precision = parseInt(options.precision ?? "1");
        this.#height = parseInt(options.height ?? "200");
        this.#yMin = parseFloat(options.yMin);
        this.#yMax = parseFloat(options.yMax);
        this.#goal = options.goal ? parseFloat(options.goal) : null;
        this.#trackingWindowDays = parseInt(options.trackingWindowDays);
        this.#visibleWindowDays = parseInt(options.visibleWindowDays);
        this.#ignoreSkippedDays = options.ignoreSkippedDays === "true";

        this.#store = new GoalTrackerStore(this._services.storage, `goal-binary-tracker-component.${this.id}`);
        if (!this.#store.trackingStartDate)
        {
            this.#store.trackingStartDate = Temporal.Now.plainDateISO();
        }
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const today = Temporal.Now.plainDateISO();
        const yesterday = Temporal.Now.plainDateISO().subtract({ days: 1 });

        // There is an important difference between undefined and null here:
        //  - undefined means a value for this date has not been set explicitly
        //  - null means a value for this date has been explicitly set to be ignored
        //    (thus, for null we consider that a day has an entry)
        const hasEntryForToday = this.#store.getValue(today) !== undefined;

        const successRates = this.#calculateSuccessRatesUntilDate(
            hasEntryForToday ? today : yesterday,
            this.#visibleWindowDays,
            this.#trackingWindowDays,
            /* includeDaysWithoutValue */ !this.#ignoreSkippedDays);

        const currentSuccessRateEntry = successRates.length > 0
            ? successRates.reduce((a, b) => Temporal.PlainDate.compare(a.date, b.date) > 0 ? a : b)
            : null;

        const data = {
            title: this.#title,
            currentCalculatedValue: currentSuccessRateEntry !== null
                ? currentSuccessRateEntry.value.toFixed(this.#precision) + this.#unit
                : null,
            currentCalculatedValueBasis: currentSuccessRateEntry !== null
                ? {
                    successCount: currentSuccessRateEntry.basis.successCount,
                    failureCount: currentSuccessRateEntry.basis.daysAttempted - currentSuccessRateEntry.basis.successCount,
                }
                : null,
            needTodaysEntry: !hasEntryForToday,
            ignoreSkippedDays: this.#ignoreSkippedDays,
        };

        container.innerHTML = await this._template("template", data);

        const elements = {
            chart: container.querySelector(".chart"),
            currentValueLabel: container.querySelector(".current-value"),
            historyEditorDialog: container.querySelector(".history-editor"),
            todaysEntryContainer: container.querySelector(".todays-entry"),
        };

        if (!hasEntryForToday)
        {
            elements.todaysEntryContainer.addEventListener("click", async e =>
            {
                if (!e.target.nodeName === "A") return;

                e.preventDefault();

                const value =
                    e.target.dataset.value === "true" ? true :
                    e.target.dataset.value === "false" ? false :
                    null;
                
                this.#setRawEntry(today, value);
                await this.render(container, /* refreshData */ false);
            });
        }

        elements.currentValueLabel.addEventListener("click", async e =>
        {
            e.preventDefault();

            const rawEntries = this.#getRawEntriesUntilDate(
                today,
                /*includeDaysWithoutValue */ true
            ).sort((a, b) => Temporal.PlainDate.compare(a.date, b.date) > 0 ? -1 : 1);

            if (rawEntries.length >= this.#trackingWindowDays)
            {
                if (this.#ignoreSkippedDays)
                {
                    for (let i = 0, trackedCount = 0; i < rawEntries.length; ++i)
                    {
                        if (rawEntries[i].value !== null &&
                            rawEntries[i].value !== undefined)
                        {
                            trackedCount++;
                        }

                        if (trackedCount === this.#trackingWindowDays)
                        {
                            rawEntries[i].isLastTrackedEntry = true;
                            break;
                        }
                    }
                }
                else
                {
                    rawEntries[this.#trackingWindowDays - 1].isLastTrackedEntry = true;
                }
            }

            const data = {
                entries: rawEntries,
                ignoreSkippedDays: this.#ignoreSkippedDays,
            };

            elements.historyEditorDialog.innerHTML = await this._template("history-editor", data);
            elements.historyEditorDialog.querySelector(".editable-elements-container").addEventListener("change", e =>
            {
                if (!e.target.classList.contains("editable-element")) return;

                e.preventDefault();

                const date = Temporal.PlainDate.from(e.target.closest("[data-date]").dataset.date);
                const value =
                    e.target.value === "true" ? true :
                    e.target.value === "false" ? false :
                    e.target.value === "null" ? null :
                    e.target.checked;

                this.#setRawEntry(date, value);
                elements.historyEditorDialog.dataset.haveValuesChanged = true;
            });

            elements.historyEditorDialog.dataset.haveValuesChanged = false;
            elements.historyEditorDialog.showModal();
        });

        elements.historyEditorDialog.addEventListener("close", async () =>
        {
            if (!elements.historyEditorDialog.dataset.haveValuesChanged) return;
            
            await this.render(container, /* refreshData */ false);
        });

        Charts.renderLineChart(
            elements.chart,
            this.#height,
            this.#yMin,
            this.#yMax,
            this.#visibleWindowDays,    // xWidthInDataPoints
            this.#goal,
            value => value.toFixed(this.#precision) + this.#unit,   // valueFormatter
            successRates);
    }

    /**
     * @param {Temporal.PlainDate} date
     * @param {boolean} value
     */
    #setRawEntry(date, value)
    {
        this.#store.setValue(date, value);
    }

    /**
     * @param {Temporal.PlainDate} targetDate
     * @param {number} daysToCalculate
     * @param {number} calculationLookbackDays
     * @param {boolean} includeDaysWithoutValue
     * 
     * @returns {{
     *      date: Temporal.PlainDate,
     *      value: number,
     *      basis: {
     *          successCount: number,
     *          daysAttempted: number
     *      }
     * }[]}
     */
    #calculateSuccessRatesUntilDate(targetDate, daysToCalculate, calculationLookbackDays, includeDaysWithoutValue)
    {
        const successRates = [];

        const rawEntries = this.#getRawEntriesUntilDate(targetDate, includeDaysWithoutValue);
        
        let rollingSuccessCount = null;
        for (
            let currentIndexForCalculation = Math.max(0, rawEntries.length - daysToCalculate);
            currentIndexForCalculation < rawEntries.length;
            currentIndexForCalculation++)
        {
            const lookbackPeriodStartIndex = currentIndexForCalculation - calculationLookbackDays + 1;  // can be negative

            if (rollingSuccessCount === null)
            {
                // Calculate success count for the very first day.

                rollingSuccessCount = 0;
                for (let i = Math.max(0, lookbackPeriodStartIndex); i <= currentIndexForCalculation; ++i)
                {
                    rollingSuccessCount += rawEntries[i].value ? 1 : 0;
                }
            }
            else
            {
                rollingSuccessCount -= lookbackPeriodStartIndex > 0 && rawEntries[lookbackPeriodStartIndex - 1].value ? 1 : 0;
                rollingSuccessCount += rawEntries[currentIndexForCalculation].value ? 1 : 0;
            }

            const daysAttempted = currentIndexForCalculation - Math.max(0, lookbackPeriodStartIndex) + 1;
            const successRate = 100 * rollingSuccessCount / daysAttempted;
            successRates.push({
                date: rawEntries[currentIndexForCalculation].date,
                value: successRate,
                basis: {
                    successCount: rollingSuccessCount,
                    daysAttempted: daysAttempted,
                },
            });
        }

        return successRates;
    }

    /**
     * @param {Temporal.PlainDate} targetDate
     * @param {boolean} includeDaysWithoutValue
     * 
     * @returns {{
     *      date: Temporal.PlainDate,
     *      value: number
     * }[]}
     */
    #getRawEntriesUntilDate(targetDate, includeDaysWithoutValue)
    {
        Argument.notNullOrUndefined(targetDate, "targetDate");
        Argument.isInstanceOf(targetDate, Temporal.PlainDate, "targetDate");
        Argument.notNullOrUndefined(includeDaysWithoutValue, "includeDaysWithoutValue");

        const rawEntries = [];

        for (
            let date = this.#store.trackingStartDate;
            Temporal.PlainDate.compare(date, targetDate) <= 0;
            date = date.add({ days: 1 }))
        {
            const value = this.#store.getValue(date);
            if ((value === undefined || value === null) && !includeDaysWithoutValue)
            {
                continue;
            }

            rawEntries.push({ date, value });
        }

        return rawEntries;
    }
}