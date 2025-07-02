import Argument from '/lib/argument.js';
import DailyStore from '/lib/daily-store.js';
import BaseComponent from '/components/base-component.js';
import Charts from '/components/goal/charts.js';
import { Temporal } from '@js-temporal/polyfill';

export default class GoalNumericTrackerComponent extends BaseComponent
{
    #title;
    #unit;
    #precision;
    #width;
    #height;
    #yMin;
    #yMax;
    #goal;
    #visibleWindowDays;
    #ignoreSkippedDays;

    /**
     * @type {DailyStore<number>}
     */
    #store;

    /**
     * @returns {Temporal.PlainDate}
     */
    get #trackingStartDate()
    {
        const serialized = this._services.storage.getItem(
            `goal-numeric-tracker-component.${this.id}.tracking-start-date`);
        return serialized ? Temporal.PlainDate.from(serialized) : null;
    }

    /**
     * @param {Temporal.PlainDate} date
     */
    set #trackingStartDate(date)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        this._services.storage.setItem(
            `goal-numeric-tracker-component.${this.id}.tracking-start-date`,
            date.toJSON());
    }

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
        this.#width = parseInt(options.width ?? "250");
        this.#height = parseInt(options.height ?? "200");
        this.#yMin = parseFloat(options.yMin);
        this.#yMax = parseFloat(options.yMax);
        this.#goal = options.goal ? parseFloat(options.goal) : null;
        this.#visibleWindowDays = parseInt(options.visibleWindowDays);
        this.#ignoreSkippedDays = options.ignoreSkippedDays === "true";

        this.#store = new DailyStore(this._services.storage, `goal-numeric-tracker-component.${this.id}`);
        if (!this.#trackingStartDate)
        {
            this.#trackingStartDate = Temporal.Now.plainDateISO();
        }
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const today = Temporal.Now.plainDateISO();
        const yesterday = Temporal.Now.plainDateISO().subtract({ days: 1 });

        const hasEntryForToday = this.#store.getValue(today) !== undefined;

        const entries = this.#getEntriesUntilDate(
            today,
            /* includeDaysWithoutValue */ !this.#ignoreSkippedDays
        ).slice(-this.#visibleWindowDays);

        let currentEntry = entries.length > 0
            ? entries.reduce((a, b) => Temporal.PlainDate.compare(a.date, b.date) > 0 ? a : b)
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
                if (isNaN(value) || !this.#ignoreSkippedDays && value === null)
                {
                    elements.todaysValueInput.style.border = "1px solid red";
                    return;
                }

                this.#setEntry(today, value);
                await this.render(container, /* refreshData */ false);
            });
        }

        elements.currentValueLabel.addEventListener("click", async e =>
        {
            e.preventDefault();

            const historyEntries = this.#getEntriesUntilDate(
                today,
                /*includeDaysWithoutValue */ true
            ).sort((a, b) => Temporal.PlainDate.compare(a.date, b.date) > 0 ? -1 : 1);

            elements.historyEditorDialog.innerHTML = await this._template("history-editor", { entries: historyEntries });
            elements.historyEditorDialog.querySelector(".editable-elements-container").addEventListener("change", e =>
            {
                if (!e.target.classList.contains("editable-element")) return;
                if (isNaN(Number(e.target.value))) return;

                e.preventDefault();

                const date = Temporal.PlainDate.from(e.target.dataset.date);
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
            this.#width,
            this.#height,
            this.#yMin,
            this.#yMax,
            this.#goal,
            "Value",
            `.${this.#precision}f`,
            entries);
    }

    /**
     * @param {Temporal.PlainDate} date
     * @param {number} value
     */
    #setEntry(date, value)
    {
        this.#store.setValue(date, value);
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
    #getEntriesUntilDate(targetDate, includeDaysWithoutValue)
    {
        Argument.notNullOrUndefined(targetDate, "targetDate");
        Argument.isInstanceOf(targetDate, Temporal.PlainDate, "targetDate");
        Argument.notNullOrUndefined(includeDaysWithoutValue, "includeDaysWithoutValue");

        const values = [];

        for (
            let date = this.#trackingStartDate;
            Temporal.PlainDate.compare(date, targetDate) <= 0;
            date = date.add({ days: 1 }))
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