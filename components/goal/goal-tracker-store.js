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

        const key = date.startOfDay().toISOString();
        return this.#values.get(key);
    }

    setValue(date, value)
    {
        Argument.notNullOrUndefined(date, "date");

        const key = date.startOfDay().toISOString();

        this.#values = this.#readAllValues();
        this.#values.set(key, value);

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
}