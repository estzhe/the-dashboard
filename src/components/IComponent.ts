import ComponentMessage from "app/dashboard/ComponentMessage.js";

export default interface IComponent
{
    readonly id: string;
    readonly kind: string;
    
    onMessage(message: ComponentMessage): Promise<void>;
}