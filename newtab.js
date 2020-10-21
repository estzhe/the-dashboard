"use strict";

document.addEventListener("DOMContentLoaded", async () =>
{
    document.querySelector("div.components-container").innerHTML =
        localStorage.getItem("options.layout") ?? "";

    const componentContainers = document.body.querySelectorAll("div[component]");
    for (const container of componentContainers)
    {
        const componentName = container.getAttribute("component");
        if (!componentName)
        {
            throw new Error(`One of the components is missing a component name.`);
        }

        const componentRoot = `/components/${componentName}`;
        const componentFileName = `${componentName.replace("/", "-")}.js`;

        const { default: ComponentClass } = await import(`.${componentRoot}/${componentFileName}`);
        
        container.classList.add(componentName, "component");

        const instance = new ComponentClass(componentRoot, container);
        await instance.render();
    }
});
