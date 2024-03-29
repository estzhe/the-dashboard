import DailyStore from '/lib/daily-store.js';
import BaseComponent from '/components/base-component.js';
import { marked } from 'marked';
import { Temporal } from '@js-temporal/polyfill';

export default class PeriodicTextComponent extends BaseComponent
{
    #title;
    #recentItemsToShowInHistory;

    /**
     * @type {DailyStore<string>}
     */
    #store;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.id)
        {
            throw new Error("periodic-text: 'id' attribute is required.");
        }

        if (options.recentItemsToShowInHistory < 0)
        {
            throw new Error("periodic-text: 'recent-items-to-show-in-history' attribute should be equal or greater than zero.");
        }

        this.#title = options.title;
        this.#recentItemsToShowInHistory = options.recentItemsToShowInHistory ?? 7;

        this.#store = new DailyStore(this._services.storage, `periodic-text-component.${this.id}`);
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const data = {
            title: this.#title,
            html: markdownToHtml(this.#readTodaysMarkdown() ?? ""),
        }; 
        container.innerHTML = await this._template("template", data);

        const elements = {
            container: container,
            view: container.querySelector("div.view"),
            text: container.querySelector("div.text"),
            editButton: container.querySelector(".edit"),
            editorDialog: container.querySelector("dialog.editor"),
        };

        (data.html ? elements.editButton : elements.view).addEventListener("click", async e =>
        {
            e.preventDefault();

            await this.#renderEditor(
                elements.editorDialog,
                newMarkdown => this.render(container, /* refreshData */ false));
        });
    }

    #readTodaysMarkdown()
    {
        const today = Temporal.Now.plainDateISO();
        return this.#store.getValue(today);
    }

    #saveTodaysMarkdown(markdown)
    {
        const today = Temporal.Now.plainDateISO();
        this.#store.setValue(today, markdown);
    }

    /**
     * Returns specified number of recent entries, excluding today's, in reverse chronological order.
     * 
     * @param {number} count
     * 
     * @returns {{ date: Temporal.PlainDate, value: TValue }[]}
     */
    #readRecentEntries(count)
    {
        const today = Temporal.Now.plainDateISO();
        
        let recent = this.#store.getRecentItems(count + 1);
        if (recent.length > 0 && recent[0].date.equals(today))
        {
            recent = recent.slice(1);
        }

        if (recent.length > count)
        {
            recent = recent.slice(0, count);
        }

        return recent;
    }

    async #renderEditor(editorDialog, saveCallback)
    {
        const markdown = this.#readTodaysMarkdown() ?? "";
        
        const data = {
            today: {
                markdown: markdown,
                html: markdownToHtml(markdown),
            },
            recentItemsToShowInHistory: this.#recentItemsToShowInHistory,
            pastItems: this.#readRecentEntries(this.#recentItemsToShowInHistory)
                           .map(e => ({
                               date: e.date,
                               markdown: e.value,
                               html: markdownToHtml(e.value),
                           })),
        };

        editorDialog.innerHTML = await this._template("editor", data);

        const elements = {
            editorDialog: editorDialog,
            saveButton: editorDialog.querySelector(".save"),
            cancelButton: editorDialog.querySelector(".cancel"),
            textarea: editorDialog.querySelector("textarea"),
            preview: editorDialog.querySelector("div.preview"),
            history: editorDialog.querySelector(".history"),
        };

        elements.saveButton.addEventListener("click", () =>
        {
            const newMarkdown = elements.textarea.value;

            this.#saveTodaysMarkdown(newMarkdown);
            
            saveCallback(newMarkdown);
            elements.editorDialog.close();
        });

        elements.cancelButton.addEventListener("click", () =>
        {
            elements.editorDialog.close();
        });

        elements.textarea.addEventListener("input", e =>
        {
            elements.preview.innerHTML = markdownToHtml(e.target.value);
        });

        elements.editorDialog.addEventListener("keydown", e =>
        {
            if (e.ctrlKey && e.code === "KeyS" ||
                e.ctrlKey && e.code == "Enter")
            {
                e.preventDefault();
                elements.saveButton.click();
            }
        });

        elements.history.addEventListener("click", e =>
        {
            if (e.target.classList.contains("copy"))
            {
                const markdown = e.target.closest("[data-markdown]").dataset.markdown;
                elements.textarea.value = markdown;
                elements.textarea.dispatchEvent(new Event("input"));
            }
        });

        elements.editorDialog.showModal();
        elements.textarea.focus();
    }
}

function markdownToHtml(markdown)
{
    return marked(markdown, { breaks: true });
}