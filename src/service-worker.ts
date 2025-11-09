import { Temporal } from '@js-temporal/polyfill';
import DashboardEngine from 'app/dashboard/DashboardEngine.js';

chrome.runtime.onInstalled.addListener(
    details =>
    {
        void chrome.alarms.create("refreshData", {
            periodInMinutes: 5,
            delayInMinutes: 1,
        });
    }
);

chrome.alarms.onAlarm.addListener(
    alarm =>
    {
        if (alarm.name === "refreshData")
        {
            void onRefreshData();
        }
    }
);

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) =>
    {
        if (message.type === "cors-bypass.lightphone.notes.fetch-text-note-content")
        {
            fetch(message.uri).then(_ => _.text()).then(_ => sendResponse(_));
        }

        return true;
    });

async function onRefreshData()
{
    const dashboardEngine = new DashboardEngine();
    await dashboardEngine.refreshData();

    console.log("Data refreshed at:", Temporal.Now.plainDateTimeISO().toLocaleString());
}