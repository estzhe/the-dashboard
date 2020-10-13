"use strict";

import { Argument } from '../lib/argument.js';

export class MarkdownTextComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

        const id = container.getAttribute("id");
        if (!id)
        {
            throw new Error("markdown-text: 'id' attribute is required.");
        }

        this.container = container;
        this.id = id;
    }

    static get name() { return "markdown-text"; }

    render()
    {
        this.container.innerHTML = `
            <button class='edit' style='float: right'>edit</button>
            <div class='text'></div>
            
            <dialog class='editor' style='width: 70%; height: 70%;'>
                <div style='width: 100%; height: 100%; display: flex; flex-direction: column;'>
                    <div style='text-align: right'>
                        <button class='save'>save</button>
                        <button class='cancel'>cancel</button>
                    </div>

                    <div style='display: flex; flex-grow: 1;'>
                        <textarea style='flex-grow: 1; flex-basis: 0'>#Hello!</textarea>
                        <div class='preview' style='flex-grow: 1; flex-basis: 0'></div>
                    </div>
                </div>
            </dialog>
        `;

        this.elements = {
            container: this.container,
            text: this.container.querySelector("div.text"),
            editButton: this.container.querySelector("button.edit"),
            saveButton: this.container.querySelector("button.save"),
            cancelButton: this.container.querySelector("button.cancel"),
            textarea: this.container.querySelector("textarea"),
            preview: this.container.querySelector("div.preview"),
            editorDialog: this.container.querySelector("dialog.editor")
        };

        this.elements.editButton.addEventListener("click", () =>
        {
            const text = this.#loadText() ?? "";

            this.elements.textarea.value = text;
            this.elements.preview.innerHTML = marked(text);

            this.elements.editorDialog.showModal();
        });

        this.elements.saveButton.addEventListener("click", () =>
        {
            const newText = this.elements.textarea.value;

            this.#saveText(newText);

            this.elements.text.innerHTML = marked(newText);
            this.elements.editorDialog.close();
        });

        this.elements.cancelButton.addEventListener("click", () =>
        {
            this.elements.editorDialog.close();
        });

        this.elements.textarea.addEventListener("input", e =>
        {
            this.elements.preview.innerHTML = marked(e.target.value);
        });

        this.elements.text.innerHTML = marked(this.#loadText() ?? "<i>markdown-text: Click 'edit' to add text.</i>");
    }

    #loadText()
    {
        return localStorage.getItem(`markdown-text.text.${this.id}`);
    }

    #saveText(value)
    {
        localStorage.setItem(`markdown-text.text.${this.id}`, value);
    }
}