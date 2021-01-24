import Argument from '/lib/argument.js';

/**
 * @template T
 */
export default class AsyncLazy
{
    /**
     * @type {function(): Promise<T>}
     */
    #asyncValueFactory;

    /**
     * @type {Promise<T>}
     */
    #valuePromise;

    /**
     * @param {function(): Promise<T>} asyncValueFactory 
     */
    constructor(asyncValueFactory)
    {
        Argument.notNullOrUndefined(asyncValueFactory, "asyncValueFactory");

        this.#asyncValueFactory = asyncValueFactory;
        this.#valuePromise = null;
    }

    /**
     * @returns {T}
     */
    async getValue()
    {
        if (!this.#valuePromise)
        {
            this.#valuePromise = await this.#asyncValueFactory();
        }

        return await this.#valuePromise;
    }
}