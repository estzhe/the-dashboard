import BaseComponent from '/components/base-component.js';

export default class MarkdownTextComponent extends BaseComponent
{
    #id;

    constructor(root, container)
    {
        super(root, container);

        const id = container.getAttribute("id");
        if (!id)
        {
            throw new Error("markdown-text: 'id' attribute is required.");
        }

        this.#id = id;
    }

    async render()
    {
        const html = markdownToHtml(this.#loadText() ?? "");
        this._container.innerHTML = await this._template("template", html);

        const elements = {
            container: this._container,
            text: this._container.querySelector("div.text"),
            editButton: this._container.querySelector(".edit"),
            saveButton: this._container.querySelector(".save"),
            cancelButton: this._container.querySelector(".cancel"),
            textarea: this._container.querySelector("textarea"),
            preview: this._container.querySelector("div.preview"),
            editorDialog: this._container.querySelector("dialog.editor")
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