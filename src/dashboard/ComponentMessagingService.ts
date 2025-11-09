import Argument from "app/lib/Argument.js";
import ComponentMessage from "app/dashboard/ComponentMessage.js";
import IComponentCollection from "app/dashboard/IComponentCollection.js";
import IComponent from "app/components/IComponent.js";

export default class ComponentMessagingService
{
    private readonly sender: { readonly id: string, readonly kind: string };
    private readonly componentCollection: IComponentCollection;

    public constructor(
        sender: { readonly id: string, readonly kind: string },
        componentCollection: IComponentCollection)
    {
        Argument.notNullOrUndefined(sender, "sender");
        Argument.notNullOrUndefined(componentCollection, "componentCollection");

        this.sender = sender;
        this.componentCollection = componentCollection;
    }
    
    public async send(message: ComponentMessage): Promise<void>
    {
        Argument.notNullOrUndefined(message, "message");
        Argument.oneOf(message.audience, ["all", "component"], "message.audience");
        
        let audience: IComponent[];
        if (message.audience === "all")
        {
            const components = await this.componentCollection.getComponents();
            audience = components.filter(component => component.id !== this.sender.id);
        }
        else
        {
            const components = await this.componentCollection.getComponents();
            audience = components.filter(component =>
                component.kind === this.sender.kind &&
                component.id !== this.sender.id);
        }
        
        await Promise.all(audience.map(component => component.onMessage(message)));
    }
}
