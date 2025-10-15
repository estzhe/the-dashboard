import Argument from 'app/lib/argument.js';
import * as parse5 from "parse5";

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

        const doc = parse5.parse(layout);

        const componentOptions = [];
        DashboardLayout.#walkDomForComponentOptions(doc, componentOptions);
        
        return componentOptions;
    }

    static #walkDomForComponentOptions(node, componentOptions)
    {
        const options = DashboardLayout.#tryExtractComponentOptions(node);
        if (options)
        {
            componentOptions.push(options);
        }
        
        if (node.childNodes)
        {
            for (const child of node.childNodes)
            {
                this.#walkDomForComponentOptions(child, componentOptions);
            }
        }
    }

    static #tryExtractComponentOptions(node)
    {
        if (node.tagName !== "div") return null;
        
        const componentAttribute = node.attrs.find(a => a.name === "component");
        if (!componentAttribute) return null;
        
        const componentName = componentAttribute.value;
        if (!componentName)
        {
            throw new Error(`One of the components is missing a component name. Layout: '${parse5.serialize(node)}'.`);
        }
        
        const attributes = node.attrs.filter(a => !["style", "class"].includes(a.name));
        const options = Object.fromEntries(
            attributes.map(a => [
                DashboardLayout.#camelizeAttributeName(a.name),
                a.value,
            ]));
        
        return options;
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