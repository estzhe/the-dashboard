import Dashboard from '/dashboard/dashboard.js';

chrome.runtime.onInstalled.addListener(
    details =>
    {
        chrome.alarms.create("refreshData", {
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
            onRefreshData();
        }
    }
);

async function onRefreshData()
{
    const dashboard = new Dashboard();
    await dashboard.refreshData();

    console.log("Data refreshed at:", new Date());
}