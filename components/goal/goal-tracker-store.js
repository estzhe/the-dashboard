import { Temporal } from '@js-temporal/polyfill';
import Argument from '/lib/argument.js';

/**
 * @template TValue
 */
export default class GoalTrackerStore
{
    /**
     * @type {Storage}
     */
    #storage;

    /**
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
     * @returns {Temporal.PlainDate}
     */
    get trackingStartDate()
    {
        const serialized = this.#storage.getItem(`${this.#namespace}.tracking-start-date`);
        return serialized ? Temporal.PlainDate.from(serialized) : null;
    }

    /**
     * @param {Temporal.PlainDate} date
     */
    set trackingStartDate(date)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        this.#storage.setItem(
            `${this.#namespace}.tracking-start-date`,
            date.toJSON());
    }

    /**
     * @param {Temporal.PlainDate} date
     * 
     * @returns {TValue}
     */
    getValue(date)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        if (!this.#values)
        {
            this.#values = this.#readAllValues();
        }

        const key = this.#toKey(date);
        return this.#values.get(key);
    }

    /**
     * @param {Temporal.PlainDate} date
     * @param {TValue} value
     */
    setValue(date, value)
    {
        Argument.notNullOrUndefined(date, "date");
        Argument.isInstanceOf(date, Temporal.PlainDate, "date");

        const key = this.#toKey(date);

        this.#values = this.#readAllValues();
        
        if (value === undefined)
        {
            this.#values.delete(key);
        }
        else
        {
            this.#values.set(key, value);
        }

        this.#storeAllValues(this.#values);
    }

    #readAllValues()
    {
        const serialized = this.#storage.getItem(`${this.#namespace}.values`);
        if (!serialized)
        {
            return new Map();
        }

        return new Map(JSON.parse(serialized));
    }

    #storeAllValues(values)
    {
        const serialized = JSON.stringify(Array.from(values));
        this.#storage.setItem(`${this.#namespace}.values`, serialized);
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