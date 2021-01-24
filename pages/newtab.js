"use strict";

import Dashboard from '/dashboard/dashboard.js';

const elements = {};
const dashboard = new Dashboard();

document.addEventListener("DOMContentLoaded", async () =>
{
    elements.refreshButton = document.querySelector(".refresh");
    elements.dashboardContainer = document.querySelector("div.components-container");

    elements.refreshButton.addEventListener("click", onRefreshClick);
    document.addEventListener("keydown", onKeyDown);

    await onLoad();
});

async function onLoad()
{
    await dashboard.render(elements.dashboardContainer, /* refreshData */ false);
}

async function onRefreshClick(e)
{
    e.preventDefault();

    await dashboard.render(elements.dashboardContainer, /* refreshData */ true);
}

function onKeyDown(e)
{
    const tag = e.target.tagName.toLowerCase();
    if (tag === "textarea" || tag == "input")
    {
        return;
    }

    if (e.key == "o")
    {
        e.preventDefault();
        chrome.tabs.update({ url: "pages/options.html" });
    }
    else if (e.key == "r")
    {
        e.preventDefault();
        elements.refreshButton.click();
    }
}
