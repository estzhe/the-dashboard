import IComponent from "app/components/IComponent.js";

export default interface IComponentRenderer extends IComponent
{
    render(refreshData: boolean): Promise<void>;
}