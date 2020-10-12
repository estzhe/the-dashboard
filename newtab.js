"use strict";

import { GithubMarkdownComponent } from '/components/github-markdown.js';
import { GithubIssuesComponent } from '/components/github-issues.js';

const knownComponents = {
    "github-markdown": GithubMarkdownComponent,
    "github-issues": GithubIssuesComponent
};

const components = [];

document.addEventListener("DOMContentLoaded", () =>
{
    const componentContainers = document.body.querySelectorAll("div[component]");

    for (const container of componentContainers)
    {
        const componentName = container.getAttribute("component");
        if (!componentName)
        {
            throw new Error(`One of the components is missing a component name.`);
        }

        const component = knownComponents[componentName];
        if (!component)
        {
            throw new Error(`${componentName} is not a known component.`);
        }

        const instance = new component(container);
        instance.render();

        components.push(instance);
    }
});
