import BaseComponent from 'app/components/base-component.js';
import { marked } from 'marked';
import template from 'app/components/markdown-text/template.hbs';

export default class MarkdownTextComponent extends BaseComponent
{
    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const html = markdownToHtml(await this.#loadText() ?? "");
        container.innerHTML = template(html);

        const elements = {
            container: container,
            text: container.querySelector("div.text"),
            editButton: container.querySelector(".edit"),
            saveButton: container.querySelector(".save"),
            cancelButton: container.querySelector(".cancel"),
            textarea: container.querySelector("textarea"),
            preview: container.querySelector("div.preview"),
            editorDialog: container.querySelector("dialog.editor")
        };

        elements.editButton.addEventListener("click", async e =>
        {
            e.preventDefault();

            const text = await this.#loadText() ?? "";

            elements.textarea.value = text;
            elements.preview.innerHTML = markdownToHtml(text);

            elements.editorDialog.showModal();
            elements.textarea.focus();
        });

        elements.saveButton.addEventListener("click", async () =>
        {
            const newText = elements.textarea.value;

            await this.#saveText(newText);

            elements.text.innerHTML = markdownToHtml(newText);
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
                e.ctrlKey && e.code === "Enter")
            {
                e.preventDefault();
                elements.saveButton.click();
            }
        });
    }

    async #loadText()
    {
        return await this._services.storage.getItem(`markdown-text.text.${this.id}`);
    }

    async #saveText(value)
    {
        await this._services.storage.setItem(`markdown-text.text.${this.id}`, value);
    }
}

function markdownToHtml(markdown)
{
    return marked(markdown, { breaks: true });
}