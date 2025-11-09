import Argument from 'app/lib/Argument.js';
import BaseComponentOptions from "app/components/BaseComponentOptions.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import IComponentEngine from "app/components/IComponentEngine.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import IComponentRenderer from "app/components/IComponentRenderer.js";

export default class ComponentResolver
{
    /**
     * Path to folder with all the components. Does not need a forward slash at the end.
     */
    private readonly componentsRoot: string;
    private readonly componentKindRegex: RegExp = /^[a-z0-9-\/]+$/;
    
    public constructor(componentsRoot: string)
    {
        Argument.notNullOrUndefined(componentsRoot, "componentsRoot");

        this.componentsRoot =
            componentsRoot === "" || componentsRoot.endsWith("/")
                ? componentsRoot
                : componentsRoot + "/";
    }
    
    public async createEngine(
        componentKind: string,
        options: BaseComponentOptions,
        services: DashboardServices): Promise<IComponentEngine>
    {
        Argument.notNullOrUndefinedOrEmpty(componentKind, "componentKind");
        Argument.matches(componentKind, this.componentKindRegex, "componentKind");
        Argument.notNullOrUndefined(options, "options");
        Argument.notNullOrUndefined(services, "services");

        const componentRoot = this.componentsRoot + componentKind;

        // TODO: Ideally we want to reuse componentRoot here, but for that
        //       the module argument to import() would be completely dynamic,
        //       which webpack has issues with. It needs a static prefix.
        //       Gotta figure out how to fix this.
        const module = await import(`/components/${componentKind}/Engine.ts`);
        const engineClass: ComponentEngineConstructor = module.default;

        return new engineClass(componentRoot, options, services);
    }

    public async createRenderer(
        engine: IComponentEngine,
        container: HTMLElement): Promise<IComponentRenderer>
    {
        Argument.notNullOrUndefined(engine, "componentEngine");
        Argument.notNullOrUndefined(container, "container");

        const componentRoot = this.componentsRoot + engine.kind;

        // TODO: Ideally we want to reuse componentRoot here, but for that
        //       the module argument to import() would be completely dynamic,
        //       which webpack has issues with. It needs a static prefix.
        //       Gotta figure out how to fix this.
        const module = await import(`/components/${engine.kind}/Renderer.ts`);
        const rendererClass: ComponentRendererConstructor = module.default;

        return new rendererClass(engine, container);
    }
}

type ComponentEngineConstructor =
    new (...args: ConstructorParameters<typeof BaseComponentEngine>) => InstanceType<typeof BaseComponentEngine>;

type ComponentRendererConstructor =
    new (...args: ConstructorParameters<typeof BaseComponentRenderer>) => InstanceType<typeof BaseComponentRenderer>;