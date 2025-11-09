import Argument from 'app/lib/Argument.js';
import DailyStore from 'app/lib/daily-store/DailyStore.js';
import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";
import { Temporal } from '@js-temporal/polyfill';
import DashboardServices from "app/dashboard/DashboardServices.js";
import PlainDate = Temporal.PlainDate;
import Options from "app/components/goal/binary-tracker/Options.js";
import SingleDaySuccessRateWithBasis from "app/components/goal/binary-tracker/SingleDaySuccessRateWithBasis.js";
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
    public readonly trackingWindowDays: number;
    public readonly visibleWindowDays: number;
    public readonly ignoreSkippedDays: boolean;
    public readonly store: DailyStore<boolean|null>;

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

        if (!options.trackingWindowDays)
        {
            throw new Error("goal/binary-tracker: 'trackingWindowDays' attribute is required.");
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
        this.trackingWindowDays = parseInt(options.trackingWindowDays);
        this.visibleWindowDays = parseInt(options.visibleWindowDays);
        this.ignoreSkippedDays = options.ignoreSkippedDays === "true";

        this.store = new DailyStore(this.services.storage, `goal-binary-tracker-component.${this.id}`);
    }

    public async getValue(date: PlainDate): Promise<boolean|null|undefined>
    {
        return await this.store.getValue(date);
    }

    public async setValue(date: PlainDate, value: boolean|null|undefined): Promise<void>
    {
        await this.store.setValue(date, value);
    }

    public async getSuccessRatesUntilDate(
        targetDate: PlainDate,
        daysToCalculate: number,
        calculationLookbackDays: number,
        includeDaysWithoutValue: boolean): Promise<SingleDaySuccessRateWithBasis[]>
    {
        const successRates: SingleDaySuccessRateWithBasis[] = [];

        const singleDayValues: SingleDayValue<boolean|null|undefined>[] =
            await this.getSingleDayValuesUntilDate(targetDate, includeDaysWithoutValue);

        let rollingSuccessCount: number|null = null;
        for (
            let currentIndexForCalculation: number = Math.max(0, singleDayValues.length - daysToCalculate);
            currentIndexForCalculation < singleDayValues.length;
            currentIndexForCalculation++)
        {
            const lookbackPeriodStartIndex: number = currentIndexForCalculation - calculationLookbackDays + 1;  // can be negative

            if (rollingSuccessCount === null)
            {
                // Calculate success count for the very first day.
                rollingSuccessCount = 0;
                for (let i = Math.max(0, lookbackPeriodStartIndex); i <= currentIndexForCalculation; ++i)
                {
                    rollingSuccessCount += singleDayValues[i]!.value ? 1 : 0;
                }
            }
            else
            {
                rollingSuccessCount -= lookbackPeriodStartIndex > 0 && singleDayValues[lookbackPeriodStartIndex - 1]!.value ? 1 : 0;
                rollingSuccessCount += singleDayValues[currentIndexForCalculation]!.value ? 1 : 0;
            }

            const daysAttempted = currentIndexForCalculation - Math.max(0, lookbackPeriodStartIndex) + 1;
            const successRate = 100 * rollingSuccessCount / daysAttempted;
            successRates.push({
                date: singleDayValues[currentIndexForCalculation]!.date,
                value: successRate,
                basis: {
                    successCount: rollingSuccessCount,
                    daysAttempted: daysAttempted,
                },
            });
        }

        return successRates;
    }

    public async getSingleDayValuesUntilDate(
        targetDate: PlainDate,
        includeDaysWithoutValue: boolean): Promise<SingleDayValue<boolean|null|undefined>[]>
    {
        Argument.notNullOrUndefined(targetDate, "targetDate");
        Argument.isInstanceOf(targetDate, PlainDate, "targetDate");
        Argument.notNullOrUndefined(includeDaysWithoutValue, "includeDaysWithoutValue");

        const rawEntries: SingleDayValue<boolean|null|undefined>[] = [];

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

            rawEntries.push({ date, value });
        }

        return rawEntries;
    }

    private async getTrackingStartDate(): Promise<PlainDate>
    {
        const key = `goal-binary-tracker-component.${this.id}.tracking-start-date`;
        const value = await this.services.storage.getOrSetItem(key, () => Temporal.Now.plainDateISO().toJSON());
        return PlainDate.from(value);
    }
}
