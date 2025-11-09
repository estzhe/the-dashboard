import { marked } from 'marked';
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/markdown-text/Engine.js";
import template from 'app/components/markdown-text/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    private elements?: {
        preview: HTMLElement,
        saveButton: HTMLElement,
        text: HTMLElement,
        editButton: HTMLElement,
        cancelButton: HTMLElement,
        textarea: HTMLTextAreaElement,
        editorDialog: HTMLDialogElement,
    };
    
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const html: string = markdownToHtml(await this.engine.loadText() ?? "");
        this.container.innerHTML = template(html);
        
        this.elements = {
            preview: this.container.querySelector<HTMLElement>("div.preview")!,
            saveButton: this.container.querySelector<HTMLElement>(".save")!,
            text: this.container.querySelector<HTMLElement>("div.text")!,
            editButton: this.container.querySelector<HTMLElement>(".edit")!,
            cancelButton: this.container.querySelector<HTMLElement>(".cancel")!,
            textarea: this.container.querySelector<HTMLTextAreaElement>("textarea")!,
            editorDialog: this.container.querySelector<HTMLDialogElement>("dialog.editor")!,
        };

        this.elements.editButton.addEventListener("click", async e => await this.onEditButtonClick(e));
        this.elements.saveButton.addEventListener("click", async e => await this.onSaveButtonClick(e));
        this.elements.cancelButton.addEventListener("click", e => this.onCancelButtonClick(e));
        this.elements.textarea.addEventListener("input", e => this.onTextAreaInput(e));
        this.elements.editorDialog.addEventListener("keydown", e => this.onEditorDialogKeyDown(e));
    }
    
    private async onEditButtonClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const text: string = await this.engine.loadText() ?? "";

        this.elements!.textarea.value = text;
        this.elements!.preview.innerHTML = markdownToHtml(text);

        this.elements!.editorDialog.showModal();
        this.elements!.textarea.focus();
    }
    
    private async onSaveButtonClick(e: MouseEvent): Promise<void>
    {
        const newText: string = this.elements!.textarea.value;

        await this.engine.saveText(newText);

        this.elements!.text.innerHTML = markdownToHtml(newText);
        this.elements!.editorDialog.close();
    }
    
    private onCancelButtonClick(e: MouseEvent)
    {
        const editorDialog = this.container.querySelector<HTMLDialogElement>("dialog.editor")!
        editorDialog.close();
    }
    
    private onTextAreaInput(e: Event)
    {
        const textArea = (e.target as HTMLTextAreaElement)!;
        this.elements!.preview.innerHTML = markdownToHtml(textArea.value);
    }
    
    private onEditorDialogKeyDown(e: KeyboardEvent)
    {
        if (e.ctrlKey && e.code === "KeyS" ||
            e.ctrlKey && e.code === "Enter")
        {
            e.preventDefault();
            this.elements!.saveButton.click();
        }
    }
}

function markdownToHtml(markdown: string): string
{
    return marked(markdown, { breaks: true, async: false });
}