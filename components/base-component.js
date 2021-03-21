import Argument from '/lib/argument.js';
import ReadCache from '/lib/read-cache.js';

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
     *      storage: {Storage},
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
        
        this.#id = options.id;
        this.#pathToComponent = pathToComponent;
        this.#services = Object.freeze({
            storage: localStorage,
            cache: new ReadCache(options.id, localStorage),
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
     *      storage: {Storage},
     *      cache: {ReadCache},
     * }}
     */
    get _services() { return this.#services; }

    /**
     * Returns a template with substitutions from `data`.
     * 
     * @param {string} name 
     * @param {object} data
     */
    async _template(name, data)
    {
        Argument.notNullOrUndefinedOrEmpty(name, "name");

        const request = await fetch(`${this._pathToComponent}/${name}.hbs`);

        const templateText = await request.text();
        const template = Handlebars.compile(templateText);
        
        return template(data);
    }
}