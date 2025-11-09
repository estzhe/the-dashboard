import { Temporal } from '@js-temporal/polyfill';
import DashboardRenderer from 'app/dashboard/DashboardRenderer.js';
import ReadableTemporalFormat from 'app/lib/ReadableTemporalFormat.js';
import DashboardEngine from "app/dashboard/DashboardEngine.js";

let dashboardRenderer: DashboardRenderer;

let elements: undefined | {
    refreshButton: HTMLElement,
    dashboardContainer: HTMLElement,
    lastDataRefreshDateSpan: HTMLElement,
};

document.addEventListener("DOMContentLoaded", onDomContentLoaded);

async function onDomContentLoaded(): Promise<void>
{
    elements = {
        refreshButton: document.querySelector<HTMLElement>(".refresh")!,
        dashboardContainer: document.querySelector<HTMLElement>("div.components-container")!,
        lastDataRefreshDateSpan: document.querySelector<HTMLElement>("span.last-data-refresh-date")!,
    };

    dashboardRenderer = new DashboardRenderer(
        new DashboardEngine(),
        elements.dashboardContainer);

    elements.refreshButton.addEventListener("click", onRefreshButtonClick);
    document.addEventListener("keydown", onDocumentKeyDown);

    await dashboardRenderer.render(/*refreshData*/ false);

    const lastDataRefreshDate: Temporal.Instant | null = await dashboardRenderer.engine.getLastDataRefreshDate();
    elements.lastDataRefreshDateSpan.innerHTML =
        lastDataRefreshDate !== null
            ? ReadableTemporalFormat.plainDateTimeToString(
                lastDataRefreshDate
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
                    .toPlainDateTime())
            : "never";
}

async function onRefreshButtonClick(e: MouseEvent): Promise<void>
{
    e.preventDefault();

    await dashboardRenderer.render(/*refreshData*/ true);

    const lastDataRefreshDate = await dashboardRenderer.engine.getLastDataRefreshDate();
    elements!.lastDataRefreshDateSpan.innerHTML =
        lastDataRefreshDate !== null
            ? ReadableTemporalFormat.plainDateTimeToString(
                lastDataRefreshDate
                    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
                    .toPlainDateTime())
            : "never";
}

function onDocumentKeyDown(e: KeyboardEvent)
{
    const targetElement = e.target as HTMLElement;
    
    const tag = targetElement.tagName.toLowerCase();
    if (tag === "textarea" || tag === "input")
    {
        return;
    }

    if (e.code === "KeyO")
    {
        e.preventDefault();
        void chrome.tabs.update({ url: "src/pages/options.html" });
    }
    else if (e.code === "KeyR" && !e.ctrlKey && !e.altKey)
    {
        e.preventDefault();
        elements!.refreshButton.click();
    }
}
