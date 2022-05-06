"use strict";

import { Temporal } from '@js-temporal/polyfill';
import Dashboard from '/dashboard/dashboard.js';
import ReadableTemporalFormat from '/lib/readable-temporal-format.js';

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
            ? ReadableTemporalFormat.plainDateTimeToString(
                dashboard.lastDataRefreshDate
                         .toZonedDateTimeISO(Temporal.Now.timeZone())
                         .toPlainDateTime())
            : "never";
}

async function onRefreshClick(e)
{
    e.preventDefault();

    await dashboard.render(elements.dashboardContainer, /* refreshData */ true);

    elements.lastDataRefreshDateSpan.innerHTML =
        dashboard.lastDataRefreshDate !== null
            ? ReadableTemporalFormat.plainDateTimeToString(
                dashboard.lastDataRefreshDate
                         .toZonedDateTimeISO(Temporal.Now.timeZone())
                         .toPlainDateTime())
            : "never";
}

function onKeyDown(e)
{
    const tag = e.target.tagName.toLowerCase();
    if (tag === "textarea" || tag == "input")
    {
        return;
    }

    if (e.key === "o")
    {
        e.preventDefault();
        chrome.tabs.update({ url: "pages/options.html" });
    }
    else if ((e.key === "r" || e.code === "KeyR") && !e.ctrlKey && !e.altKey)
    {
        e.preventDefault();
        elements.refreshButton.click();
    }
}
