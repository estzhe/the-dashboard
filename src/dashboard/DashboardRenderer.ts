import Argument from 'app/lib/Argument.js';
import AsyncLazy from 'app/lib/AsyncLazy.js';
import { Temporal } from '@js-temporal/polyfill';
import IComponentCollection from "app/dashboard/IComponentCollection.js";
import IComponentRenderer from "app/components/IComponentRenderer.js";
import DashboardEngine from "app/dashboard/DashboardEngine.js";
import IComponentEngine from "app/components/IComponentEngine.js";
import IStorage from "app/lib/IStorage.js";
import ChromeLocalStorage from "app/lib/ChromeLocalStorage.js";
import ComponentResolver from "app/dashboard/ComponentResolver.js";

export default class DashboardRenderer implements IComponentCollection
{
    public readonly engine: DashboardEngine;
    
    private readonly container: HTMLElement;
    
    private componentsLazy: AsyncLazy<IComponentRenderer[]>;

    public constructor(
        container: HTMLElement,
        storage: IStorage = new ChromeLocalStorage(),
        componentResolver = new ComponentResolver("/components"))
    {
        Argument.notNullOrUndefined(container, "container");
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefined(componentResolver, "componentResolver");
        
        this.container = container;
        this.engine = new DashboardEngine(storage, componentResolver, /*messagingComponentCollection*/ this);

        this.componentsLazy = new AsyncLazy(async () => await this.createComponentInstances());
    }
    
    public async render(refreshData: boolean): Promise<void>
    {
        const layout: string = await this.engine.getLayout();

        // If the dashboard has already been rendered, we ideally want to avoid full re-rendering,
        // because during full re-rendering elements will jump around, which is not very pleasant.
        const newLayoutHashCode = DashboardRenderer.getHashCode(layout).toString();
        const oldLayoutHashCode = this.container.dataset.layoutHash;
        const needsFullRender = newLayoutHashCode !== oldLayoutHashCode;
        if (needsFullRender)
        {
            this.container.innerHTML = layout;
            this.container.dataset.layoutHash = newLayoutHashCode;
            this.componentsLazy = new AsyncLazy(async () => await this.createComponentInstances());
        }

        const components: IComponentRenderer[] = await this.componentsLazy.getValue();
        await Promise.all(components.map(
            async component =>
            {
                const componentContainer = this.container.querySelector<HTMLElement>(`[id='${component.id}']`)!;

                try
                {
                    await component.render(refreshData);
                    componentContainer.classList.remove("failed");
                    componentContainer.removeAttribute("title");
                }
                catch (e)
                {
                    componentContainer.classList.add("failed");
                    componentContainer.setAttribute("title", e.toString());
                    
                    console.error(`Failed to render component ${component.id}`, e);
                }
            }
        ));

        if (refreshData)
        {
            await this.engine.setLastDataRefreshDate(Temporal.Now.instant());
        }
    }

    public async getComponents(): Promise<IComponentRenderer[]>
    {
        return await this.componentsLazy.getValue();
    }
    
    private async createComponentInstances(): Promise<IComponentRenderer[]>
    {
        const componentEngines: IComponentEngine[] = await this.engine.getComponents();
        
        return await Promise.all(componentEngines.map(
            async engine =>
            {
                const componentContainer = this.container.querySelector<HTMLElement>(`[id='${engine.id}']`)!;
                return await this.engine.componentResolver.createRenderer(engine, componentContainer);
            }));
    }

    /**
     * @see https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     */
    private static getHashCode(value: string): number
    {
        let hash: number = 0;

        for (let i = 0; i < value.length; ++i)
        {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0; // convert to 32-bit integer
        }

        return hash;
    }
}
