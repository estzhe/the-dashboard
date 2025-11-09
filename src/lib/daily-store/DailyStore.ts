import { Temporal } from '@js-temporal/polyfill';
import Argument from 'app/lib/Argument.js';
import IStorage from "app/lib/IStorage.js";
import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";

/**
 * Associates a single value with each date.
 * 
 * `undefined` is treated as and is indistinguishable from an absent value.
 * 
 * @template TValue - Type of value to be associated with each date.
 */
export default class DailyStore<TValue>
{
    private readonly storage: IStorage;

    /**
     * Prefix to be used for namespacing all the values stored by this instance.
     */
    private readonly namespace: string;
    
    private values: Map<string, TValue>|null;

    constructor(storage: IStorage, namespace: string)
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(namespace, "namespace");

        this.storage = storage;
        this.namespace = namespace;
        this.values = null;
    }

    /**
     * Returns value associated with specified date, or undefined if there is no value associated with the date.
     */
    public async getValue(date: Temporal.PlainDate): Promise<TValue|undefined>
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        if (!this.values)
        {
            this.values = await this.readAllValues();
        }

        const key = this.toKey(date);
        return this.values.get(key);
    }

    /**
     * Returns recent items in reverse chronological order.
     *
     * @param {number} count - Number of most recent items to return.
     */
    public async getRecentItems(count: number): Promise<SingleDayValue<TValue>[]>
    {
        Argument.isNumber(count, "count");
        Argument.min(count, 0, "count");

        if (count === 0)
        {
            return [];
        }

        if (!this.values)
        {
            this.values = await this.readAllValues();
        }

        return Array.from(this.values)
                    .map(v => ({
                        date: Temporal.PlainDate.from(v[0]),
                        value: v[1],
                    }))
                    .sort((v1, v2) => Temporal.PlainDate.compare(v2.date, v1.date))
                    .slice(0, count);
    }

    /**
     * Stores an association between specified date and value.
     * If value is undefined, the existing association is removed, if it was present.
     */
    public async setValue(date: Temporal.PlainDate, value: TValue|undefined): Promise<void>
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        const key = this.toKey(date);

        this.values = await this.readAllValues();
        
        if (value === undefined)
        {
            this.values.delete(key);
        }
        else
        {
            this.values.set(key, value);
        }

        await this.storeAllValues(this.values);
    }

    private async readAllValues(): Promise<Map<string, TValue>>
    {
        const serialized = await this.storage.getItem(`${this.namespace}.values`);
        if (!serialized)
        {
            return new Map();
        }

        return new Map(JSON.parse(serialized));
    }

    private async storeAllValues(values: Map<string, TValue>): Promise<void>
    {
        const serialized = JSON.stringify(Array.from(values));
        await this.storage.setItem(`${this.namespace}.values`, serialized);
    }
    
    private toKey(date: Temporal.PlainDate): string
    {
        return date.toJSON();
    }
}