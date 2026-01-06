import Argument from 'app/lib/Argument.js';
import IStorage from "app/lib/IStorage.js";

export default class ReadCache
{
    private readonly namespace: string;
    private readonly storage: IStorage;

    /**
     * Note: can be shared across multiple cache instances.
     */
    private pendingRequests: { [key: string]: Promise<any> } = {};

    public constructor(namespace: string, storage: IStorage)
    {
        Argument.notNullOrUndefinedOrEmpty(namespace, "namespace");
        Argument.notNullOrUndefined(storage, "storage");
        
        this.namespace = namespace;
        this.storage = storage;
    }

    /**
     * Gets an item from cache or fetches it and populates the cache.
     * 
     * If an item is already present, it will just return it, unless
     * `refresh` is true.
     * 
     * If `refresh` is true, or an item is not present in cache, it
     * will fetch the item, store and return it.
     */
    public async get<T>(
        key: string,
        fetchData: () => Promise<T>,
        refresh: boolean): Promise<T>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");
        Argument.notNullOrUndefined(fetchData, "fetchData");

        const value = await this.readEntry<T>(key);
        if (value !== undefined && !refresh)
        {
            return value;
        }
        
        const requestsKey = this.getFullyQualifiedKey(key);
        if (this.pendingRequests[requestsKey])
        {
            return this.pendingRequests[requestsKey];
        }

        this.pendingRequests[requestsKey] = (async () =>
        {    
            try
            {
                const value = await fetchData();
                await this.writeEntry(key, value);
                return value;
            }
            finally
            {
                delete this.pendingRequests[requestsKey];
            }
        })();
        
        return this.pendingRequests[requestsKey];
    }

    /**
     * Updates value in cache under specified `key`.
     */
    public async update<T>(
        key: string,
        modify: (value: T) => T): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");
        Argument.notNullOrUndefined(modify, "modify");

        const value = await this.readEntry<T>(key);
        if (value === undefined)
        {
            throw new Error(`Could not update cache value under key '${key}': key not present in cache.`);
        }

        const newValue = modify(value);
        await this.writeEntry(key, newValue);
    }

    /**
     * Returns a new cache instance further scoped to `subScope`
     * (full namespace becomes the namespace of current cache instance + subScope).
     */
    public scope(subScope: string): ReadCache
    {
        Argument.notNullOrUndefinedOrEmpty(subScope, "subScope");
        
        const scopedNamespace = `${this.namespace}.${subScope}`;
        const scopedCache = new ReadCache(scopedNamespace, this.storage);
        scopedCache.pendingRequests = this.pendingRequests;
        
        return scopedCache;
    }
    
    private async readEntry<T>(key: string): Promise<T | undefined>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");

        const storageKey = this.getFullyQualifiedKey(key);

        let json = await this.storage.getItem(storageKey);
        return json ? JSON.parse(json) : undefined;
    }

    private async writeEntry<T>(key: string, value: T): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(key, "key");

        const storageKey = this.getFullyQualifiedKey(key);
        const json = JSON.stringify(value);
        
        await this.storage.setItem(storageKey, json);
    }
    
    private getFullyQualifiedKey(entryKey: string): string
    {
        return `read-cache.${this.namespace}.${entryKey}`;
    }
}
