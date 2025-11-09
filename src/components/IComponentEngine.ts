import IComponent from "app/components/IComponent.js";

export default interface IComponentEngine extends IComponent
{
    refreshData(): Promise<void>;
}