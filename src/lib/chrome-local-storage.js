export default class ChromeLocalStorage
{
    async setItem(key, value){
        return new Promise(resolve => {
            chrome.storage.local.set(
                {
                    [key]: String(value),
                },
                resolve);
        });
    }

    async getItem(key) {
        return new Promise(resolve => {
            chrome.storage.local.get(
                key,
                result => {
                    resolve(result[key] ?? null);
                });
        });
    }

    async removeItem(key) {
        return new Promise(resolve => {
            chrome.storage.local.remove(key, resolve);
        });
    }
}
