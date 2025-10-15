import Argument from 'app/lib/argument.js';
import ChromeLocalStorage from 'app/lib/chrome-local-storage.js';
import ReadCache from 'app/lib/read-cache.js';

export default class BaseComponent
{
    /**
     * @type {string}
     */
    #id;

    /**
     * @type {string}
     */
    #pathToComponent;

    /**
     * @type {{
     *      storage: {ChromeLocalStorage},
     *      cache: {ReadCache},
     * }}
     */
    #services;

    /**
     * @param {string} pathToComponent 
     * @param {object} options 
     */
    constructor(pathToComponent, options)
    {
        if (new.target === "BaseComponent")
        {
            throw new TypeError("BaseComponent is an abstract class and cannot be instantiated directly.");
        }

        Argument.notNullOrUndefined(pathToComponent, "pathToComponent");
        Argument.notNullOrUndefined(options, "options");

        if (!options.id)
        {
            throw new Error("Component options must have a unique 'id' property.");
        }
        
        const storage = new ChromeLocalStorage();
        
        this.#id = options.id;
        this.#pathToComponent = pathToComponent;
        this.#services = Object.freeze({
            storage: storage,
            cache: {
                instance: new ReadCache("instance." + options.id, storage, navigator.locks),
                component: new ReadCache("component." + pathToComponent, storage, navigator.locks),
            },
        });
    }

    /**
     * @param {HTMLElement} container 
     * @param {boolean} refreshData 
     * 
     * @returns {Promise}
     */
    async render(container, refreshData)
    {
        Argument.notNullOrUndefined(container, "container");
        container.classList.add("component");

        container.removeAttribute("title");
    }

    /**
     * @returns {Promise}
     */
    async refreshData()
    {
    }
    
    /**
     * @type {string}
     */
    get id() { return this.#id; }

    /**
     * @type {string}
     */
    get _pathToComponent() { return this.#pathToComponent };

    /**
     * @type {{
     *      storage: {ChromeLocalStorage},
     *      cache: {ReadCache},
     * }}
     */
    get _services() { return this.#services; }
}