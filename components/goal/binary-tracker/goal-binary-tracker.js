import Argument from '/lib/argument.js';
import "/lib/date.js";

import BaseComponent from '/components/base-component.js';
import Charts from '/components/goal/charts.js';
import GoalTrackerStore from '/components/goal/goal-tracker-store.js';

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

        this.#store = new GoalTrackerStore(this._services.storage, `goal-binary-tracker-component.${this.id}`);
        if (!this.#store.trackingStartDate)
        {
            this.#store.trackingStartDate = Date.today();
        }
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const hasEntryForToday = this.#store.getValue(Date.today()) !== undefined;

        const calculatedEntries = this.#getCalculatedEntries(
            /* startDate */ Date.today().addDays(-(this.#visibleWindowDays - 1)),
            /* endDate */ hasEntryForToday ? Date.today() : Date.yesterday(),
            /* lookbackPeriod */ this.#trackingWindowDays);

        const currentCalculatedEntry = calculatedEntries.length > 0
            ? calculatedEntries.reduce((a, b) => a.date > b.date ? a : b)
            : null;

        const data = {
            title: this.#title,
            currentCalculatedValue: currentCalculatedEntry !== null ? currentCalculatedEntry.value.toFixed(this.#precision) + this.#unit : null,
            currentCalculatedValueBasis: currentCalculatedEntry !== null
                ? {
                    successCount: currentCalculatedEntry.basis.successCount,
                    failureCount: currentCalculatedEntry.basis.daysAttempted - currentCalculatedEntry.basis.successCount,
                }
                : null,
            needTodaysEntry: !hasEntryForToday,
        };

        container.innerHTML = await this._template("template", data);

        const elements = {
            chart: container.querySelector(".chart"),
            currentValueLabel: container.querySelector(".current-value"),
            historyEditorDialog: container.querySelector(".history-editor"),
            todaysEntryYesAnchor: container.querySelector(".todays-entry .yes"),
            todaysEntryNoAnchor: container.querySelector(".todays-entry .no"),
        };

        if (!hasEntryForToday)
        {
            elements.todaysEntryYesAnchor.addEventListener("click", async e =>
            {
                e.preventDefault();
                
                this.#setRawEntry(Date.today(), true);
                await this.render(container, /* refreshData */ false);
            });

            elements.todaysEntryNoAnchor.addEventListener("click", async e =>
            {
                e.preventDefault();

                this.#setRawEntry(Date.today(), false);
                await this.render(container, /* refreshData */ false);
            });
        }

        elements.currentValueLabel.addEventListener("click", async e =>
        {
            e.preventDefault();

            const rawEntries = this.#getRawEntries(
                /* startDate */ Date.today().addDays(-(this.#visibleWindowDays + this.#trackingWindowDays)),
                /* endDate */ Date.today(),
            );

            elements.historyEditorDialog.innerHTML = await this._template("history-editor", { entries: rawEntries });
            elements.historyEditorDialog.querySelector(".editable-elements-container").addEventListener("change", e =>
            {
                if (!e.target.classList.contains("editable-element")) return;

                e.preventDefault();

                const date = new Date(e.target.dataset.date);
                const value = e.target.checked;

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
            calculatedEntries);
    }

    /**
     * @param {Date} date
     * @param {boolean} value
     */
    #setRawEntry(date, value)
    {
        this.#store.setValue(date, value);
    }

    /**
     * @param {Date} startDate
     * @param {Date} endDate
     * 
     * @returns {{
     *      date: Date,
     *      value: boolean
     * }[]}
     */
    #getRawEntries(startDate, endDate)
    {
        if (startDate < this.#store.trackingStartDate)
        {
            startDate = this.#store.trackingStartDate;
        }

        const rawEntries = [];

        for (let date = endDate; date >= startDate; date = date.addDays(-1))
        {
            rawEntries.push({
                date: date,
                value: this.#store.getValue(date),
            });
        }

        return rawEntries;
    }

    /**
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {number} lookbackDays
     * 
     * @returns {{
     *      date: Date,
     *      value: number,
     *      basis: {
     *          successCount: number,
     *          daysAttempted: number
     *      }
     * }[]}
     */
    #getCalculatedEntries(startDate, endDate, lookbackDays)
    {
        const successRates = [];

        let currentDayForCalculation = startDate < this.#store.trackingStartDate ? this.#store.trackingStartDate : startDate;
        let lookbackPeriodStartDay = currentDayForCalculation.addDays(-(lookbackDays - 1));

        let rollingSuccessCount = null;

        while (currentDayForCalculation <= endDate)
        {
            if (rollingSuccessCount === null)
            {
                // Calculate success count for very first day.

                rollingSuccessCount = 0;
                for (let day = lookbackPeriodStartDay; day <= currentDayForCalculation; day = day.addDays(1))
                {
                    rollingSuccessCount += this.#store.getValue(day) ? 1 : 0;
                }
            }
            else
            {
                rollingSuccessCount -= this.#store.getValue(lookbackPeriodStartDay.addDays(-1)) ? 1 : 0;
                rollingSuccessCount += this.#store.getValue(currentDayForCalculation) ? 1 : 0;
            }

            const daysBeforeTrackingStarted = Math.max(0, Math.round((this.#store.trackingStartDate - lookbackPeriodStartDay) / (24 * 60 * 60 * 1000)));

            const daysAttempted = this.#trackingWindowDays - daysBeforeTrackingStarted;
            const successRate = 100 * rollingSuccessCount / daysAttempted;
            successRates.push({
                date: currentDayForCalculation,
                value: successRate,
                basis: {
                    successCount: rollingSuccessCount,
                    daysAttempted: daysAttempted,
                },
            });

            currentDayForCalculation = currentDayForCalculation.addDays(1);
            lookbackPeriodStartDay = lookbackPeriodStartDay.addDays(1);
        }

        return successRates;
    }
}