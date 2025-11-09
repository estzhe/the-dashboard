import Argument from 'app/lib/Argument.js';
import AsyncLazy from 'app/lib/AsyncLazy.js';
import ChromeLocalStorage from 'app/lib/ChromeLocalStorage.js';
import DashboardLayout from 'app/dashboard/DashboardLayout.js';
import ComponentResolver from 'app/dashboard/ComponentResolver.js';
import { Temporal } from '@js-temporal/polyfill';
import DashboardServices from "app/dashboard/DashboardServices.js";
import ComponentMessagingService from "app/dashboard/ComponentMessagingService.js";
import IStorage from "app/lib/IStorage.js";
import IComponentCollection from "app/dashboard/IComponentCollection.js";
import ReadCache from "app/lib/ReadCache.js";
import IComponentEngine from "app/components/IComponentEngine.js";

export default class DashboardEngine implements IComponentCollection
{
    public readonly componentResolver: ComponentResolver;
    
    private readonly storage: IStorage;
    
    private componentsLazy: AsyncLazy<IComponentEngine[]>;

    public constructor(
        storage: IStorage = new ChromeLocalStorage(),
        componentResolver = new ComponentResolver("/components"))
    {
        this.storage = storage;
        this.componentResolver = componentResolver;
        
        this.componentsLazy = new AsyncLazy(async () => await this.createComponentInstances());
    }
    
    public async getLayout(): Promise<string>
    {
        return await this.storage.getItem("options.layout") ?? "";
    }
    
    public async setLayout(html: string): Promise<void>
    {
        await this.storage.setItem("options.layout", html);
        this.componentsLazy = new AsyncLazy(async () => await this.createComponentInstances());
    }
    
    public async getLastDataRefreshDate(): Promise<Temporal.Instant | null>
    {
        const raw = await this.storage.getItem("options.lastDataRefreshDate");
        return raw === null ? null : Temporal.Instant.from(raw);
    }
    
    public async setLastDataRefreshDate(value: Temporal.Instant): Promise<void>
    {
        Argument.notNullOrUndefined(value, "value");
        await this.storage.setItem("options.lastDataRefreshDate", value.toString());
    }

    public async refreshData(): Promise<void>
    {
        const components: IComponentEngine[] = await this.componentsLazy.getValue();
        await Promise.all(components.map(c => c.refreshData()));

        await this.setLastDataRefreshDate(Temporal.Now.instant());
    }
    
    public async getComponents(): Promise<IComponentEngine[]>
    {
        return await this.componentsLazy.getValue();
    }
    
    private async createComponentInstances(): Promise<IComponentEngine[]>
    {
        const layout = new DashboardLayout(await this.getLayout());
        
        const storage = new ChromeLocalStorage();
        const cache = new ReadCache(/*namespace*/ "dashboard", storage);

        const components: IComponentEngine[] = [];
        for (const options of layout.componentOptions)
        {
            const sender = { id: options.id, kind: options.kind };
            const messaging = new ComponentMessagingService(sender, this);
            
            const services: DashboardServices = Object.freeze({
                storage,
                messaging,
                cache: {
                    component: cache.scope(`${options.kind}.component`),
                    instance: cache.scope(`${options.kind}.instance.${options.id}`),
                },
            });
            
            const instance = await this.componentResolver.createEngine(options.kind, options, services);
            components.push(instance);
        }

        return components;
    }
}
