import Argument from '/lib/argument.js';

export default class DashboardLayout
{
    /**
     * @type {string}
     */
    #layout;

    /**
     * @type {object[]}
     */
    #componentOptions;

    /**
     * @param {string} layout 
     */
    constructor(layout)
    {
        Argument.notNullOrUndefined(layout, "layout");

        this.#layout = layout;
        this.#componentOptions = Object.freeze(DashboardLayout.#parseComponentOptions(layout));
    }

    /**
     * @returns {string}
     */
    get layout()
    {
        return this.#layout;
    }

    /**
     * @returns {object[]}
     */
    get componentOptions()
    {
        return this.#componentOptions;
    }

    /**
     * @param {string} layout
     * @returns {object[]}
     */
    static #parseComponentOptions(layout)
    {
        Argument.notNullOrUndefined(layout, "layout");

        const doc = new DOMParser().parseFromString(layout, "text/html");

        const componentOptions = [];

        const containers = doc.querySelectorAll("div[component]");
        for (const container of containers)
        {
            const componentName = container.getAttribute("component");
            if (!componentName)
            {
                throw new Error(`One of the components is missing a component name. Layout: '${container.innerHTML}'.`);
            }

            const attributes = Array.from(container.attributes)
                                    .filter(a => !["style", "class"].includes(a.name));
            const options = Object.fromEntries(
                attributes.map(a => [
                    DashboardLayout.#camelizeAttributeName(a.name),
                    a.value,
                ]));

            componentOptions.push(options);
        }

        return componentOptions;
    }

    static #camelizeAttributeName(name)
    {
        Argument.notNullOrUndefinedOrEmpty(name, "name");

        return name.replace(
            /-\w/g,
            (s, index) => index === 0
                ? s.replace("-", "")
                : s.replace("-", "").toUpperCase());
    }
}