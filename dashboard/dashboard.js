import Argument from '/lib/argument.js';
import AsyncLazy from '/lib/async-lazy.js';
import DashboardLayout from '/dashboard/dashboard-layout.js';
import ComponentResolver from '/dashboard/component-resolver.js';

export default class Dashboard
{
    /**
     * @type {Storage}
     */
    #storage;

    /**
     * @type {ComponentResolver}
     */
    #componentResolver;

    /**
     * @type {AsyncLazy<BaseComponent[]>}
     */
    #componentsLazy;

    constructor(
        storage = localStorage,
        componentResolver = new ComponentResolver("/components"))
    {
        this.#storage = storage;
        this.#componentResolver = componentResolver;
        this.#componentsLazy = new AsyncLazy(async () => await this.#createComponentInstances());
    }

    /**
     * @returns {string}
     */
    getLayout()
    {
        return this.#storage.getItem("options.layout") ?? "";
    }

    /**
     * @param {string} html
     * @returns {void}
     */
    setLayout(html)
    {
        this.#storage.setItem("options.layout", html);
        this.#componentsLazy = new AsyncLazy(async () => await this.#createComponentInstances());
    }

    /**
     * @param {HTMLElement} targetContainer
     * @param {boolean} refreshData
     * @returns {Promise}
     */
    async render(targetContainer, refreshData)
    {
        Argument.notNullOrUndefined(targetContainer, "targetContainer");

        const components = await this.#componentsLazy.getValue();

        targetContainer.innerHTML = this.getLayout();
        await Promise.all(components.map(
            component =>
            {
                const container = targetContainer.querySelector(`[id='${component.id}']`);
                return component.render(container, refreshData);
            }
        ));
    }

    /**
     * @returns {Promise}
     */
    async refreshData()
    {
        const components = await this.#componentsLazy.getValue();
        await Promise.all(components.map(c => c.refreshData()));
    }

    /**
     * @returns {BaseComponent[]}
     */
    async #createComponentInstances()
    {
        const layout = new DashboardLayout(this.getLayout());

        const components = [];
        for (const options of layout.componentOptions)
        {
            const componentName = options.component;
            const instance = await this.#componentResolver.createInstance(componentName, options);

            components.push(instance);
        }

        return components;
    }
}
