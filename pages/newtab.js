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

    const lastDataRefreshDate = await dashboard.getLastDataRefreshDate();
    elements.lastDataRefreshDateSpan.innerHTML =
        lastDataRefreshDate !== null
            ? ReadableTemporalFormat.plainDateTimeToString(
                lastDataRefreshDate
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
                    .toPlainDateTime())
            : "never";
}

async function onRefreshClick(e)
{
    e.preventDefault();

    await dashboard.render(elements.dashboardContainer, /* refreshData */ true);

    const lastDataRefreshDate = await dashboard.getLastDataRefreshDate();
    elements.lastDataRefreshDateSpan.innerHTML =
        lastDataRefreshDate !== null
            ? ReadableTemporalFormat.plainDateTimeToString(
                lastDataRefreshDate
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
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

    if (e.code === "KeyO")
    {
        e.preventDefault();
        chrome.tabs.update({ url: "pages/options.html" });
    }
    else if (e.code === "KeyR" && !e.ctrlKey && !e.altKey)
    {
        e.preventDefault();
        elements.refreshButton.click();
    }
}
