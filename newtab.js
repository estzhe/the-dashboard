"use strict";

const storage = localStorage;

document.addEventListener("DOMContentLoaded", async () =>
{
    document.querySelector("div.components-container").innerHTML =
        storage.getItem("options.layout") ?? "";

    const containers = document.body.querySelectorAll("div[component]");
    const instances = await createComponents(containers);

    document.querySelector(".refresh").addEventListener("click", async e =>
    {
        e.preventDefault();
        await refreshComponents(instances);
    });

    document.addEventListener("keydown", e =>
    {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "textarea" || tag == "input")
        {
            return;
        }

        if (e.key == "o")
        {
            e.preventDefault();
            chrome.tabs.update({ url: "options.html" });
        }
        else if (e.key == "r")
        {
            e.preventDefault();
            document.querySelector(".refresh").click();
        }
    });
});

async function createComponents(containers)
{
    const instances = [];

    for (const container of containers)
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
        instances.push(instance);
    }

    await Promise.all(instances.map(instance => instance.render(/* refresh */ false)));

    return instances;
}

async function refreshComponents(instances)
{
    await Promise.all(instances.map(instance => instance.render(/* refresh */ true)));
}
