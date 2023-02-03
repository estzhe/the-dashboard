"use strict";

import Dashboard from '/dashboard/dashboard.js';
import * as Monaco from 'monaco-editor';

document.addEventListener("DOMContentLoaded", async () =>
{
    const elements = {
        saveButton: document.querySelector("button.save"),
        cancelButton: document.querySelector("button.cancel"),
        layoutEditor: document.querySelector(".layout-editor"),
    };

    const dashboard = new Dashboard();

    const editor = Monaco.editor.create(
        elements.layoutEditor,
        {
            value: dashboard.getLayout(),
            language: 'html',
            minimap: {
                enabled: false,
            },
        },
    );
    
    elements.saveButton.addEventListener("click", () =>
    {
        dashboard.setLayout(editor.getValue());
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    elements.cancelButton.addEventListener("click", () =>
    {
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    document.addEventListener("keydown", e =>
    {
        if (e.ctrlKey && e.code === "KeyS" ||
            e.ctrlKey && e.code == "Enter")
        {
            e.preventDefault();
            elements.saveButton.click();
        }

        if (e.code == "Escape")
        {
            e.preventDefault();
            elements.cancelButton.click();
        }
    });
});
