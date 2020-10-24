import Argument from '/lib/argument.js';

export default class ComponentCache
{
    #namespace;
    #storage;

    constructor(namespace, storage)
    {
        Argument.notNullOrUndefined(storage, "storage");

        this.#namespace = namespace;
        this.#storage = storage;
    }

    /**
     * Gets an item from cache or fetches it and populates the cache.
     * If an item is already present, it will just return it, unless
     * `refresh` true. If `refresh` is true, or an itme is not present
     * in cache, it will fetch the item, store and return it.
     * 
     * @param {string} key 
     * @param {function(): Promise<*>} fetchData 
     * @param {boolean} refresh 
     * 
     * @returns {Promise<*>}
     */
    async get(key, fetchData, refresh)
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");
        Argument.notNullOrUndefined(fetchData, "fetchData");


        const storageKey = `component-cache.${this.#namespace}.${key}`;

        let json = this.#storage.getItem(storageKey);
        if (json && !refresh)
        {
            return JSON.parse(json);
        }
        else
        {
            const data = await fetchData();
            json = JSON.stringify(data);

            this.#storage.setItem(storageKey, json);

            return data;
        }
    }
}