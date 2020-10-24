"use strict";

document.addEventListener("DOMContentLoaded", async () =>
{
    document.querySelector("div.components-container").innerHTML =
        localStorage.getItem("options.layout") ?? "";

    let componentInstances = [];

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
        componentInstances.push(instance);
    }
    await Promise.all(
        componentInstances.map(instance => instance.render(/* refresh */ false)));

    document.querySelector(".refresh").addEventListener("click", async e =>
    {
        e.preventDefault();

        await Promise.all(
            componentInstances.map(instance => instance.render(/* refresh */ true)));
    });
});
