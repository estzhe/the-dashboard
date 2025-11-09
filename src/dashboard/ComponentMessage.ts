export default interface ComponentMessage
{
    /**
     * `all` - all components on the dashboard.
     * `component` - all components of sender component's type.
     */
    readonly audience: "all" | "component",
    readonly kind: string,
    readonly payload?: any,
}