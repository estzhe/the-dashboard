import Argument from 'app/lib/Argument.js';
import ComponentMessage from "app/dashboard/ComponentMessage.js";
import IComponentRenderer from "app/components/IComponentRenderer.js";
import IComponentEngine from "app/components/IComponentEngine.js";

export default abstract class BaseComponentRenderer<TComponentEngine extends IComponentEngine>
    implements IComponentRenderer
{
    public readonly id: string;
    public readonly kind: string;
    
    protected readonly engine: TComponentEngine;
    protected readonly container: HTMLElement;
    
    public constructor(
        engine: TComponentEngine,
        container: HTMLElement)
    {
        Argument.notNullOrUndefined(engine, "engine");
        Argument.notNullOrUndefined(container, "container");

        this.id = engine.id;
        this.kind = engine.kind;
        
        this.engine = engine;
        this.container = container;
    }

    public async render(refreshData: boolean): Promise<void>
    {
        this.container.classList.add("component");
        this.container.removeAttribute("title");
    }

    public async onMessage(message: ComponentMessage): Promise<void>
    {
        await this.engine.onMessage(message);
    }
}