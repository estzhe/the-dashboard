import Argument from 'app/lib/Argument.js';
import DailyStore from 'app/lib/daily-store/DailyStore.js';
import { Temporal } from '@js-temporal/polyfill';
import PlainDate = Temporal.PlainDate;
import DashboardServices from "app/dashboard/DashboardServices.js";
import Options from "app/components/goal/numeric-tracker/Options.js";
import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title: string|undefined;
    public readonly unit: string|undefined;
    public readonly precision: number;
    public readonly width: number;
    public readonly height: number;
    public readonly yMin: number;
    public readonly yMax: number;
    public readonly goal: number|undefined;
    public readonly visibleWindowDays: number;
    public readonly ignoreSkippedDays: boolean;

    private readonly store: DailyStore<number|null|undefined>;

    public constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

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

        this.title = options.title;
        this.unit = options.unit;
        this.precision = parseInt(options.precision ?? "1");
        this.width = parseInt(options.width ?? "250");
        this.height = parseInt(options.height ?? "200");
        this.yMin = parseFloat(options.yMin);
        this.yMax = parseFloat(options.yMax);
        this.goal = options.goal ? parseFloat(options.goal) : undefined;
        this.visibleWindowDays = parseInt(options.visibleWindowDays);
        this.ignoreSkippedDays = options.ignoreSkippedDays === "true";

        this.store = new DailyStore(this.services.storage, `goal-numeric-tracker-component.${this.id}`);
    }

    public async getValue(date: PlainDate): Promise<number|null|undefined>
    {
        return await this.store.getValue(date);
    }

    public async setValue(date: PlainDate, value: number|null|undefined): Promise<void>
    {
        await this.store.setValue(date, value);
    }

    public async getSingleDayValuesUntilDate(targetDate: PlainDate, includeDaysWithoutValue: boolean)
        : Promise<SingleDayValue<number|null|undefined>[]>
    {
        Argument.notNullOrUndefined(targetDate, "targetDate");
        Argument.isInstanceOf(targetDate, Temporal.PlainDate, "targetDate");
        Argument.notNullOrUndefined(includeDaysWithoutValue, "includeDaysWithoutValue");

        const values: SingleDayValue<number|null|undefined>[] = [];

        for (
            let date: PlainDate = await this.getTrackingStartDate();
            PlainDate.compare(date, targetDate) <= 0;
            date = date.add({ days: 1 }))
        {
            const value = await this.store.getValue(date);
            if ((value === undefined || value === null) && !includeDaysWithoutValue)
            {
                continue;
            }

            values.push({ date, value });
        }

        return values;
    }

    public async getTrackingStartDate(): Promise<PlainDate>
    {
        const key = `goal-numeric-tracker-component.${this.id}.tracking-start-date`;
        const value = await this.services.storage.getOrSetItem(key, () => Temporal.Now.plainDateISO().toJSON());
        return PlainDate.from(value);
    }
}