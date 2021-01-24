"use strict";

import Dashboard from '/dashboard/dashboard.js';

document.addEventListener("DOMContentLoaded", async () =>
{
    const elements = {
        saveButton: document.querySelector("button.save"),
        cancelButton: document.querySelector("button.cancel"),
        layoutTextarea: document.querySelector("textarea.layout"),
    };

    const dashboard = new Dashboard();

    elements.layoutTextarea.value = dashboard.getLayout();

    elements.saveButton.addEventListener("click", () =>
    {
        dashboard.setLayout(elements.layoutTextarea.value);
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    elements.cancelButton.addEventListener("click", () =>
    {
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    document.addEventListener("keydown", e =>
    {
        if (e.ctrlKey && e.key === "s" ||
            e.ctrlKey && e.key == "Enter")
        {
            e.preventDefault();
            elements.saveButton.click();
        }

        if (e.key == "Escape")
        {
            e.preventDefault();
            elements.cancelButton.click();
        }
    });
});
