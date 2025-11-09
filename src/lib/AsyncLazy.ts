import Argument from 'app/lib/Argument.js';

export default class AsyncLazy<T>
{
    private readonly asyncValueFactory: () => Promise<T>;
    private valuePromise: Promise<T> | null;
    
    public constructor(asyncValueFactory: () => Promise<T>)
    {
        Argument.notNullOrUndefined(asyncValueFactory, "asyncValueFactory");

        this.asyncValueFactory = asyncValueFactory;
        this.valuePromise = null;
    }
    
    async getValue(): Promise<T>
    {
        if (!this.valuePromise)
        {
            this.valuePromise = this.asyncValueFactory();
        }

        return await this.valuePromise;
    }
}