import IStorage from "app/lib/IStorage.js";

export default class ChromeLocalStorage implements IStorage
{
    async getItem(key: string): Promise<string | null>
    {
        return new Promise(resolve =>
        {
            chrome.storage.local.get(
                key,
                result =>
                {
                    resolve(result[key] ?? null);
                });
        });
    }
    
    async getOrSetItem(key: string, valueFactory: () => string): Promise<string>
    {
        let result = await this.getItem(key);
        if (result === null)
        {
            result = valueFactory();
            await this.setItem(key, result);
        }
        
        return result;
    }

    async setItem(key: string, value: string): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            chrome.storage.local.set(
                {
                    [key]: value,
                },
                resolve);
        });
    }

    async removeItem(key: string): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            chrome.storage.local.remove(key, resolve);
        });
    }
}
