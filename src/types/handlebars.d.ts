declare module "*.hbs"
{
    import type { TemplateDelegate } from "handlebars";
    
    const template: TemplateDelegate;
    export default template;
}
