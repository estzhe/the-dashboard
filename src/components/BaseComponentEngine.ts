import Argument from 'app/lib/Argument.js';
import BaseComponentOptions from "app/components/BaseComponentOptions.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import ComponentMessage from "app/dashboard/ComponentMessage.js";
import IComponentEngine from "app/components/IComponentEngine.js";

export default abstract class BaseComponentEngine
    implements IComponentEngine
{
    public readonly id: string;
    public readonly kind: string;

    protected readonly pathToComponent: string;
    protected readonly services: DashboardServices;

    public constructor(
        pathToComponent: string,
        options: BaseComponentOptions,
        services: DashboardServices)
    {
        Argument.notNullOrUndefined(pathToComponent, "pathToComponent");
        Argument.notNullOrUndefined(options, "options");
        Argument.notNullOrUndefined(services, "services");

        if (!options.id)
        {
            throw new Error("Component options must have a unique 'id' property.");
        }
        if (!options.kind)
        {
            throw new Error("Component options must have a 'kind' property.");
        }

        this.id = options.id;
        this.kind = options.kind;
        this.pathToComponent = pathToComponent;
        this.services = services;
    }

    public async refreshData(): Promise<void>
    {
    }

    public async onMessage(message: ComponentMessage): Promise<void>
    {
    }
}