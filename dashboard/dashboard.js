import Argument from '/lib/argument.js';
import AsyncLazy from '/lib/async-lazy.js';
import DashboardLayout from '/dashboard/dashboard-layout.js';
import ComponentResolver from '/dashboard/component-resolver.js';
import { Temporal } from '@js-temporal/polyfill';

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
     * @returns {Temporal.Instant?}
     */
    get lastDataRefreshDate()
    {
        const raw = this.#storage.getItem("options.lastDataRefreshDate");
        return raw === null ? null : Temporal.Instant.from(raw);
    }

    /**
     * 
     * @param {Temporal.Instant} value
     */
    set #lastDataRefreshDate(value)
    {
        Argument.notNullOrUndefined(value, "value");
        this.#storage.setItem("options.lastDataRefreshDate", value.toString());
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
        const layout = this.getLayout();

        // If the dashboard has already been rendered in targetContainer,
        // we ideally want to avoid full re-rendering, because during full
        // re-rendering elements will jump around, which is not very pleasant.
        const newLayoutHashCode = Dashboard.#getHashCode(layout).toString();
        const oldLayoutHashCode = targetContainer.dataset.layoutHash;
        const needsFullRender = newLayoutHashCode !== oldLayoutHashCode;

        if (needsFullRender)
        {
            targetContainer.innerHTML = layout;
            targetContainer.dataset.layoutHash = newLayoutHashCode;
        }

        if (refreshData)
        {
            this.#lastDataRefreshDate = Temporal.Now.instant();
        }

        await Promise.all(components.map(
            async component =>
            {
                // TODO: Not good, this needs to be part of component or layout logic.
                //       In future: each component should be split into two parts:
                //       view and data source. View would be coupled with container,
                //       while data source would be responsible for fetching data.
                const container = targetContainer.querySelector(`[id='${component.id}']`);
                
                try
                {
                    await component.render(container, refreshData);
                    container.classList.remove("failed");
                    container.removeAttribute("title");
                }
                catch (e)
                {
                    container.classList.add("failed");
                    container.setAttribute("title", e.toString());
                    
                    console.error(`Failed to render component ${component.id}`, e);
                }
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

        this.#lastDataRefreshDate = Temporal.Now.instant();
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

    /**
     * @param {string} value
     * @returns {int}
     *
     * @see https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     */
    static #getHashCode(value)
    {
        let hash = 0;

        for (let i = 0; i < value.length; ++i)
        {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0; // convert to 32bit integer
        }

        return hash;
    }
}
