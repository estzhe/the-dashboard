import Argument from '/lib/argument.js';

export default class ReadCache
{
    /**
     * @type {string}
     */
    #namespace;

    /**
     * @type {ChromeLocalStorage}
     */
    #storage;

    /**
     * @type {LockManager}
     */
    #lockManager;

    /**
     * @param {string} namespace 
     * @param {ChromeLocalStorage} storage
     * @param {LockManager} lockManager
     */
    constructor(namespace, storage, lockManager)
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefined(lockManager, "lockManager");

        this.#namespace = namespace;
        this.#storage = storage;
        this.#lockManager = lockManager;
    }

    /**
     * Gets an item from cache or fetches it and populates the cache.
     * If an item is already present, it will just return it, unless
     * `refresh` is true. If `refresh` is true, or an item is not
     * present in cache, it will fetch the item, store and return it.
     * 
     * @param {string} key 
     * @param {function(): Promise<any>} fetchData 
     * @param {boolean} refresh 
     * 
     * @returns {Promise<any>}
     */
    async get(key, fetchData, refresh)
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");
        Argument.notNullOrUndefined(fetchData, "fetchData");

        const storageKey = `read-cache.${this.#namespace}.${key}`;

        let json = await this.#storage.getItem(storageKey);
        if (json && !refresh)
        {
            const data = JSON.parse(json);
            return data.value;
        }

        const staleGeneration = json ? JSON.parse(json).generation : undefined;

        return await this.#lockManager.request(storageKey, async lock =>
        {
            json = await this.#storage.getItem(storageKey);
            let data = json ? JSON.parse(json) : null;
            
            const currentGeneration = data?.generation;
            if (data !== null && currentGeneration !== staleGeneration)
            {
                return data.value;
            }
            else
            {
                data = {
                    generation: currentGeneration !== undefined ? currentGeneration + 1 : 1,
                    value: await fetchData(),
                };
                json = JSON.stringify(data);

                await this.#storage.setItem(storageKey, json);

                return data.value;
            }
        });
    }
}