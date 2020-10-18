"use strict";

import { GithubMarkdownComponent } from "./components/github-markdown.js";
import { GithubIssuesComponent } from "./components/github-issues.js";
import { MarkdownTextComponent } from "./components/markdown-text.js";
import { GmailComponent } from "./components/gmail.js";
import { GoogleCalendarComponent } from "./components/google-calendar.js";
import { WeatherComponent } from './components/weather/component.js';

const knownComponents = [
    GithubMarkdownComponent,
    GithubIssuesComponent,
    MarkdownTextComponent,
    GmailComponent,
    GoogleCalendarComponent,
    WeatherComponent,
];

const componentInstances = [];

document.addEventListener("DOMContentLoaded", () =>
{
    document.querySelector("div.components-container").innerHTML =
        localStorage.getItem("options.layout") ?? "";

    const nameToKnownComponentMap = Object.fromEntries(knownComponents.map(c => [c.name, c]));

    const componentContainers = document.body.querySelectorAll("div[component]");
    for (const container of componentContainers)
    {
        const componentName = container.getAttribute("component");
        if (!componentName)
        {
            throw new Error(`One of the components is missing a component name.`);
        }

        const component = nameToKnownComponentMap[componentName];
        if (!component)
        {
            throw new Error(`${componentName} is not a known component.`);
        }

        container.classList.add(componentName);

        const instance = new component(container);
        instance.render();

        componentInstances.push(instance);
    }
});
