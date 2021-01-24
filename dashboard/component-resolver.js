import Argument from '/lib/argument.js';

export default class ComponentResolver
{
    /**
     * Path to folder with all the components. Does not need a forward slash at the end.
     * @type {string}
     */
    #componentsRoot;

    /**
     * @param {string} componentsRoot 
     */
    constructor(componentsRoot)
    {
        Argument.notNullOrUndefined(componentsRoot, "componentsRoot");

        this.#componentsRoot =
            componentsRoot === "" || componentsRoot.endsWith("/")
                ? componentsRoot
                : componentsRoot + "/";
    }

    /**
     * @param {string} componentName
     * @param {object} options
     * 
     * @returns {BaseComponent}
     */
    async createInstance(componentName, options)
    {
        Argument.notNullOrUndefinedOrEmpty(componentName, "componentName");
        Argument.notNullOrUndefined(options, "options");

        const componentRoot = this.#componentsRoot + componentName;
        const componentFileName = componentName.replace("/", "-") + ".js";
        
        const { default: ComponentClass } = await import(`${componentRoot}/${componentFileName}`);
        
        return new ComponentClass(componentRoot, options);
    }
}