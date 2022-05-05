import BaseComponent from '/components/base-component.js';
import { marked } from 'marked';

export default class MarkdownTextComponent extends BaseComponent
{
    #id;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.id)
        {
            throw new Error("markdown-text: 'id' attribute is required.");
        }

        this.#id = options.id;
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const html = markdownToHtml(this.#loadText() ?? "");
        container.innerHTML = await this._template("template", html);

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

        elements.editButton.addEventListener("click", e =>
        {
            e.preventDefault();

            const text = this.#loadText() ?? "";

            elements.textarea.value = text;
            elements.preview.innerHTML = markdownToHtml(text);

            elements.editorDialog.showModal();
            elements.textarea.focus();
        });

        elements.saveButton.addEventListener("click", () =>
        {
            const newText = elements.textarea.value;

            this.#saveText(newText);

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
            if (e.ctrlKey && e.key === "s" ||
                e.ctrlKey && e.key == "Enter")
            {
                e.preventDefault();
                elements.saveButton.click();
            }
        });
    }

    #loadText()
    {
        return this._services.storage.getItem(`markdown-text.text.${this.#id}`);
    }

    #saveText(value)
    {
        this._services.storage.setItem(`markdown-text.text.${this.#id}`, value);
    }
}

function markdownToHtml(markdown)
{
    return marked(markdown, { breaks: true });
}