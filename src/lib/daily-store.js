import { Temporal } from '@js-temporal/polyfill';
import Argument from 'app/lib/argument.js';

/**
 * Associates a single value with each date.
 * 
 * @template TValue - Type of value to be associated with each date.
 */
export default class DailyStore
{
    /**
     * @type {ChromeLocalStorage}
     */
    #storage;

    /**
     * Prefix to be used for namespacing all the values stored by this instance.
     * 
     * @type {string}
     */
    #namespace;

    /**
     * @type {Map<string, TValue>}
     */
    #values;

    constructor(storage, namespace)
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(namespace, "namespace");

        this.#storage = storage;
        this.#namespace = namespace;
    }

    /**
     * Returns value associated with specified date, or undefined if there is no value associated with the date.
     * 
     * @param {Temporal.PlainDate} date
     * 
     * @returns {Promise<TValue>}
     */
    async getValue(date)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        if (!this.#values)
        {
            this.#values = await this.#readAllValues();
        }

        const key = this.#toKey(date);
        return this.#values.get(key);
    }

    /**
     * Returns recent items in reverse chronological order.
     * 
     * @param {number} count - Number of most recent items to return.
     * 
     * @returns {Promise<{ date: Temporal.PlainDate, value: TValue }[]>}
     */
    async getRecentItems(count)
    {
        Argument.isNumber(count, "count");
        Argument.min(count, 0, "count");

        if (count === 0)
        {
            return [];
        }

        if (!this.#values)
        {
            this.#values = await this.#readAllValues();
        }

        return Array.from(this.#values)
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
     * 
     * @param {Temporal.PlainDate} date
     * @param {TValue} value
     */
    async setValue(date, value)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        const key = this.#toKey(date);

        this.#values = await this.#readAllValues();
        
        if (value === undefined)
        {
            this.#values.delete(key);
        }
        else
        {
            this.#values.set(key, value);
        }

        await this.#storeAllValues(this.#values);
    }

    async #readAllValues()
    {
        const serialized = await this.#storage.getItem(`${this.#namespace}.values`);
        if (!serialized)
        {
            return new Map();
        }

        return new Map(JSON.parse(serialized));
    }

    async #storeAllValues(values)
    {
        const serialized = JSON.stringify(Array.from(values));
        await this.#storage.setItem(`${this.#namespace}.values`, serialized);
    }

    /**
     * @param {Temporal.PlainDate} date
     * 
     * @returns {string}
     */
    #toKey(date)
    {
        return date.toJSON();
    }
}