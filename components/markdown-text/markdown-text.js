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

    static get name() { return "markdown-text"; }

    async render()
    {
        const html = marked(this.#loadText());
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
            elements.preview.innerHTML = marked(text);

            elements.editorDialog.showModal();
            elements.textarea.focus();
        });

        elements.saveButton.addEventListener("click", () =>
        {
            const newText = elements.textarea.value;

            this.#saveText(newText);

            elements.text.innerHTML = marked(newText);
            elements.editorDialog.close();
        });

        elements.cancelButton.addEventListener("click", () =>
        {
            elements.editorDialog.close();
        });

        elements.textarea.addEventListener("input", e =>
        {
            elements.preview.innerHTML = marked(e.target.value);
        });
    }

    #loadText()
    {
        return localStorage.getItem(`markdown-text.text.${this.#id}`);
    }

    #saveText(value)
    {
        localStorage.setItem(`markdown-text.text.${this.#id}`, value);
    }
}