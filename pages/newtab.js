"use strict";

import Dashboard from '/dashboard/dashboard.js';

const elements = {};
const dashboard = new Dashboard();

document.addEventListener("DOMContentLoaded", async () =>
{
    elements.refreshButton = document.querySelector(".refresh");
    elements.dashboardContainer = document.querySelector("div.components-container");
    elements.lastDataRefreshDateSpan = document.querySelector("span.last-data-refresh-date");

    elements.refreshButton.addEventListener("click", onRefreshClick);
    document.addEventListener("keydown", onKeyDown);

    await onLoad();
});

async function onLoad()
{
    await dashboard.render(elements.dashboardContainer, /* refreshData */ false);

    elements.lastDataRefreshDateSpan.innerHTML =
        dashboard.lastDataRefreshDate !== null
            ? dashboard.lastDataRefreshDate.toWordyDateTimeString()
            : "unknown";
}

async function onRefreshClick(e)
{
    e.preventDefault();

    await dashboard.render(elements.dashboardContainer, /* refreshData */ true);

    elements.lastDataRefreshDateSpan.innerHTML =
        dashboard.lastDataRefreshDate !== null
            ? dashboard.lastDataRefreshDate.toWordyDateTimeString()
            : "unknown";
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
    else if (e.key == "r" && !e.ctrlKey && !e.altKey)
    {
        e.preventDefault();
        elements.refreshButton.click();
    }
}
