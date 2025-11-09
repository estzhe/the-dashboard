import * as Monaco from 'monaco-editor';
import DashboardEngine from 'app/dashboard/DashboardEngine.js';

const dashboardEngine = new DashboardEngine();

let elements: undefined | {
    saveButton: HTMLElement,
    cancelButton: HTMLElement,
    layoutEditor: HTMLElement,
};

let editor: Monaco.editor.IStandaloneCodeEditor | undefined;

document.addEventListener("DOMContentLoaded", onDomContentLoaded);

async function onDomContentLoaded(): Promise<void>
{
    elements = {
        saveButton: document.querySelector<HTMLElement>("button.save")!,
        cancelButton: document.querySelector<HTMLElement>("button.cancel")!,
        layoutEditor: document.querySelector<HTMLElement>(".layout-editor")!,
    };

    editor = Monaco.editor.create(
        elements.layoutEditor,
        {
            value: await dashboardEngine.getLayout(),
            language: 'html',
            minimap: {
                enabled: false,
            },
        },
    );

    elements.saveButton.addEventListener("click", onSaveButtonClick);
    elements.cancelButton.addEventListener("click", onCancelButtonClick);
    document.addEventListener("keydown", onDocumentKeyDown);
}

async function onSaveButtonClick(e: MouseEvent): Promise<void>
{
    await dashboardEngine.setLayout(editor!.getValue());
    await chrome.tabs.update({ url: "chrome://newtab" });
}

async function onCancelButtonClick(e: MouseEvent): Promise<void>
{
    await chrome.tabs.update({ url: "chrome://newtab" });
}

function onDocumentKeyDown(e: KeyboardEvent)
{
    if (e.ctrlKey && e.code === "KeyS" ||
        e.ctrlKey && e.code === "Enter")
    {
        e.preventDefault();
        elements!.saveButton.click();
    }

    if (e.code === "Escape")
    {
        e.preventDefault();
        elements!.cancelButton.click();
    }
}