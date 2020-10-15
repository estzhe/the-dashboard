"use strict";

document.addEventListener("DOMContentLoaded", () =>
{
    const saveButton = document.querySelector("button.save");
    const cancelButton = document.querySelector("button.cancel");
    const layoutTextarea = document.querySelector("textarea.layout");

    saveButton.addEventListener("click", () =>
    {
        localStorage.setItem("options.layout", layoutTextarea.value);
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    cancelButton.addEventListener("click", () =>
    {
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    layoutTextarea.value = localStorage.getItem("options.layout") ?? "";
});