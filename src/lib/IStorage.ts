export default interface IStorage
{
    getItem(key: string): Promise<string | null>;
    getOrSetItem(key: string, valueFactory: () => string): Promise<string>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
