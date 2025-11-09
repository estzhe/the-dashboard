import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public async loadText(): Promise<string|null>
    {
        return await this.services.storage.getItem(`markdown-text.text.${this.id}`);
    }

    public async saveText(value: string): Promise<void>
    {
        await this.services.storage.setItem(`markdown-text.text.${this.id}`, value);
    }
}