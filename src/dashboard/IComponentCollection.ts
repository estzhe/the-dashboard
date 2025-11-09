import IComponent from "app/components/IComponent.js";

export default interface IComponentCollection
{
    getComponents(): Promise<IComponent[]>;
}