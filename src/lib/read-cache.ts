import Argument from 'app/lib/argument.js';
import ChromeLocalStorage from "app/lib/chrome-local-storage.js";

export default class ReadCache
{
    private readonly namespace: string;
    private readonly storage: ChromeLocalStorage;
    private readonly pendingRequests: { [key: string]: Promise<any> };

    constructor(namespace: string, storage: ChromeLocalStorage)
    {
        Argument.notNullOrUndefined(storage, "storage");
        
        this.namespace = namespace ?? "default";
        this.storage = storage;
        this.pendingRequests = {};
    }

    /**
     * Gets an item from cache or fetches it and populates the cache.
     * If an item is already present, it will just return it, unless
     * `refresh` is true. If `refresh` is true, or an item is not
     * present in cache, it will fetch the item, store and return it.
     */
    async get<T>(
        key: string,
        fetchData: () => Promise<T>,
        refresh: boolean): Promise<T | undefined | null>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");
        Argument.notNullOrUndefined(fetchData, "fetchData");

        const value = await this.readEntry<T>(key);
        if (value !== undefined && !refresh)
        {
            return value;
        }
        
        if (this.pendingRequests[key])
        {
            return this.pendingRequests[key];
        }
        
        this.pendingRequests[key] = (async () =>
        {    
            try
            {
                const value = await fetchData();
                await this.writeEntry(key, value);
                return value;
            }
            finally
            {
                delete this.pendingRequests[key];
            }
        })();
        
        return this.pendingRequests[key];
    }
    
    private async readEntry<T>(key: string): Promise<T | undefined>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");

        const storageKey = this.getFullStorageKey(key);

        let json = await this.storage.getItem(storageKey);
        return json ? JSON.parse(json) : undefined;
    }

    private async writeEntry<T>(key: string, value: T): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");

        const storageKey = this.getFullStorageKey(key);
        const json = JSON.stringify(value);
        
        await this.storage.setItem(storageKey, json);
    }
    
    private getFullStorageKey(entryKey: string): string
    {
        return `read-cache.${this.namespace}.${entryKey}`;
    }
}

interface CacheEntry<T>
{
    generation: number;
    value: T | undefined | null;
}

interface CollectionEntry<TItem>
{
    keys: string[];
    items: TItem[];
}