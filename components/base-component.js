import Argument from '../lib/argument.js';

export default class BaseComponent
{
    #container;
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
        
        this.#root = pathToComponent;
        this.#container = container;
        this.#services = Object.freeze({
            storage: null,
        });
    }

    static get name()
    {
        throw new TypeError("'name' property must be implemented by child class.");
    }

    async render()
    {
        throw new TypeError("'render()' method must be implemented by child class.");
    }

    get _container() { return this.#container; }

    get _root() { return this.#root };

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