import Argument from '/lib/argument.js';
import "/lib/date.js";

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

    get trackingStartDate()
    {
        const serialized = this.#storage.getItem(`${this.#namespace}.tracking-start-date`);
        return serialized ? new Date(serialized) : null;
    }

    set trackingStartDate(date)
    {
        this.#storage.setItem(`${this.#namespace}.tracking-start-date`, date.startOfDay().toISOString());
    }

    getValue(date)
    {
        Argument.notNullOrUndefined(date, "date");

        if (!this.#values)
        {
            this.#values = this.#readAllValues();
        }

        const key = this.#toKey(date);
        return this.#values.get(key);
    }

    setValue(date, value)
    {
        Argument.notNullOrUndefined(date, "date");

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

    #toKey(date)
    {
        const year = String(date.getFullYear()).padStart(4, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}