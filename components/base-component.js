import Argument from '/lib/argument.js';
import ComponentCache from '/components/component-cache.js';

export default class BaseComponent
{
    #container;
    #id;
    #root;
    #services;

    constructor(pathToComponent, container)
    {
        if (new.target === "BaseComponent")
        {
            throw new TypeError("BaseComponent is an abstract class and cannot be instantiated directly.");
        }

        Argument.notNullOrUndefined(pathToComponent, "pathToComponent");
        Argument.notNullOrUndefined(container, "container");

        const id = container.getAttribute("id");
        if (!id)
        {
            throw new Error("Components must have a unique 'id' attribute.");
        }
        
        this.#container = container;
        this.#id = id;
        this.#root = pathToComponent;
        this.#services = Object.freeze({
            storage: localStorage,
            cache: new ComponentCache(id, localStorage),
        });
    }

    async render(refresh)
    {
        throw new TypeError("'render(refresh)' method must be implemented by child class.");
    }

    get _container() { return this.#container; }

    get _id() { return this.#id; }

    get _root() { return this.#root };

    /**
     * @type {{
     *      storage: {Storage},
     *      cache: {ComponentCache}
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

        const request = await fetch(`${this._root}/${name}.hbs`);

        const templateText = await request.text();
        const template = Handlebars.compile(templateText);
        
        return template(data);
    }
}