import Argument from '/lib/argument.js';
import "/lib/date.js";

import BaseComponent from '/components/base-component.js';
import Charts from '/components/goal/charts.js';
import GoalTrackerStore from '/components/goal/goal-tracker-store.js';

export default class GoalNumericTrackerComponent extends BaseComponent
{
    #title;
    #unit;
    #precision;
    #height;
    #yMin;
    #yMax;
    #goal;
    #visibleWindowDays;
    #ignoreSkippedDays;

    /**
     * @type GoalTrackerStore<number>
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
        this.#visibleWindowDays = parseInt(options.visibleWindowDays);
        this.#ignoreSkippedDays = options.ignoreSkippedDays === "true";

        this.#store = new GoalTrackerStore(this._services.storage, `goal-numeric-tracker-component.${this.id}`);
        if (!this.#store.trackingStartDate)
        {
            this.#store.trackingStartDate = Date.today();
        }
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const hasEntryForToday = this.#store.getValue(Date.today()) !== undefined;

        const entries = this.#getEntriesUntilDate(
            Date.today(),
            /* includeDaysWithoutValue */ !this.#ignoreSkippedDays
        ).slice(-this.#visibleWindowDays);

        let currentEntry = entries.length > 0
            ? entries.reduce((a, b) => a.date > b.date ? a : b)
            : null;
        if (currentEntry?.value === undefined)
        {
            currentEntry = null;
        }

        const data = {
            title: this.#title,
            currentValue: currentEntry !== null ? currentEntry.value.toFixed(this.#precision) + this.#unit : null,
            needTodaysEntry: !hasEntryForToday,
        };

        container.innerHTML = await this._template("template", data);

        const elements = {
            chart: container.querySelector(".chart"),
            currentValueLabel: container.querySelector(".current-value"),
            historyEditorDialog: container.querySelector(".history-editor"),
            todaysValueInput: container.querySelector(".todays-entry input"),
            todaysValueSaveButton: container.querySelector(".todays-entry button"),
        };

        if (!hasEntryForToday)
        {
            elements.todaysValueSaveButton.addEventListener("click", async e =>
            {
                e.preventDefault();

                let value = elements.todaysValueInput.value === "" ? null : Number(elements.todaysValueInput.value);
                if (value === NaN || !this.#ignoreSkippedDays && value === null)
                {
                    elements.todaysValueInput.style.border = "1px solid red";
                    return;
                }

                this.#setEntry(Date.today(), value);
                await this.render(container, /* refreshData */ false);
            });
        }

        elements.currentValueLabel.addEventListener("click", async e =>
        {
            e.preventDefault();

            const historyEntries = this.#getEntriesUntilDate(
                Date.today(),
                /*includeDaysWithoutValue */ true
            ).sort((a, b) => a.date > b.date ? -1 : 1);

            elements.historyEditorDialog.innerHTML = await this._template("history-editor", { entries: historyEntries });
            elements.historyEditorDialog.querySelector(".editable-elements-container").addEventListener("change", e =>
            {
                if (!e.target.classList.contains("editable-element")) return;
                if (Number(e.target.value) === NaN) return;

                e.preventDefault();

                const date = new Date(e.target.dataset.date);
                const value = e.target.value === "" ? null : Number(e.target.value);

                this.#setEntry(date, value);
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
            value => value === undefined || value === null ? "-" : value.toFixed(this.#precision) + this.#unit,   // valueFormatter
            entries);
    }

    /**
     * @param {Date} date
     * @param {number} value
     */
    #setEntry(date, value)
    {
        this.#store.setValue(date, value);
    }

    /**
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {boolean} includeDaysWithoutValue
     * 
     * @returns {{
     *      date: Date,
     *      value: number
     * }[]}
     */
    #getEntriesUntilDate(targetDate, includeDaysWithoutValue)
    {
        Argument.notNullOrUndefined(targetDate, "targetDate");
        Argument.notNullOrUndefined(includeDaysWithoutValue, "includeDaysWithoutValue");

        const values = [];

        for (let date = this.#store.trackingStartDate; date <= targetDate; date = date.addDays(1))
        {
            const value = this.#store.getValue(date);
            if ((value === undefined || value === null) && !includeDaysWithoutValue)
            {
                continue;
            }

            values.push({ date, value });
        }

        return values;
    }
}