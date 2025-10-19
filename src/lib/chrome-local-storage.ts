export default class ChromeLocalStorage
{
    async setItem(key: string, value: string): Promise<void> {
        return new Promise<void>(resolve => {
            chrome.storage.local.set(
                {
                    [key]: value,
                },
                resolve);
        });
    }

    async getItem(key: string): Promise<string | null> {
        return new Promise(resolve => {
            chrome.storage.local.get(
                key,
                result => {
                    resolve(result[key] ?? null);
                });
        });
    }

    async removeItem(key: string): Promise<void> {
        return new Promise<void>(resolve => {
            chrome.storage.local.remove(key, resolve);
        });
    }
}
