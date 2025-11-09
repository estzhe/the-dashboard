import Argument from 'app/lib/Argument.js';
import BaseComponentOptions from "app/components/BaseComponentOptions.js";
import * as parse5 from "parse5";
import { DefaultTreeAdapterTypes } from "parse5";
import ParentNode = DefaultTreeAdapterTypes.ParentNode;
import Element = DefaultTreeAdapterTypes.Element;

export default class DashboardLayout
{
    private readonly _layout: string;
    private readonly _componentOptions: Readonly<BaseComponentOptions[]>;
    
    public constructor(layout: string)
    {
        Argument.notNullOrUndefined(layout, "layout");

        this._layout = layout;
        this._componentOptions = Object.freeze(DashboardLayout.parseComponentOptions(layout));
    }

    public get layout(): string
    {
        return this._layout;
    }

    public get componentOptions(): Readonly<BaseComponentOptions[]>
    {
        return this._componentOptions;
    }
    
    private static parseComponentOptions(layout: string): BaseComponentOptions[]
    {
        Argument.notNullOrUndefined(layout, "layout");

        const doc = parse5.parse(layout);
        
        const componentOptions: BaseComponentOptions[] = [];
        DashboardLayout.walkDomForComponentOptions(doc, componentOptions);
        
        return componentOptions;
    }

    private static walkDomForComponentOptions(
        node: DefaultTreeAdapterTypes.Node,
        componentOptions: BaseComponentOptions[]): void
    {
        const nodeAsElement = node as Element;
        if (nodeAsElement.tagName)
        {
            const options = DashboardLayout.tryExtractComponentOptions(nodeAsElement);
            if (options)
            {
                componentOptions.push(options);
            }
        }
        
        const nodeAsParent = node as ParentNode;
        if (nodeAsParent.childNodes)
        {
            for (const child of nodeAsParent.childNodes)
            {
                this.walkDomForComponentOptions(child, componentOptions);
            }
        }
    }

    private static tryExtractComponentOptions(element: Element): BaseComponentOptions | null
    {
        if (element.tagName !== "div") return null;
        
        const componentAttribute = element.attrs.find(a => a.name === "component");
        if (!componentAttribute) return null;
        
        const kind = DashboardLayout.getRequiredAttributeValue(element, "component");
        const id = DashboardLayout.getRequiredAttributeValue(element, "id");
        
        const attributes = element.attrs.filter(
            a => !["style", "class", "id", "component"].includes(a.name));
        const options = Object.fromEntries(
            attributes.map(a => [
                DashboardLayout.camelizeAttributeName(a.name),
                a.value,
            ]));
        
        return {
            kind,
            id,
            ...options,
        };
    }
    
    private static getRequiredAttributeValue(node: Element, attributeName: string): string
    {
        const attribute = node.attrs.find(a => a.name === attributeName);
        if (!attribute)
        {
            throw new Error(
                `Component missing a required attribute '${attributeName}'. ` +
                `Layout: '${parse5.serialize(node)}'.`);
        }
        
        if (!attribute.value)
        {
            throw new Error(
                `Component has an empty value for a required attribute '${attributeName}'. ` +
                `Layout: '${parse5.serialize(node)}'.`);
        }
        
        return attribute.value;
    }

    private static camelizeAttributeName(name: string): string
    {
        Argument.notNullOrUndefinedOrEmpty(name, "name");

        return name.replace(
            /-\w/g,
            (s, index) => index === 0
                ? s.replace("-", "")
                : s.replace("-", "").toUpperCase());
    }
}