import { marked } from 'marked';
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/periodic-text/Engine.js";
import template from 'app/components/periodic-text/templates/template.hbs';
import editorTemplate from 'app/components/periodic-text/templates/editor.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    private elements?: {
        view: HTMLElement,
        text: HTMLElement,
        editButton: HTMLElement,
        editorDialog: HTMLDialogElement,
        editor?: {
            textarea: HTMLTextAreaElement,
            preview: HTMLElement,
            history: HTMLElement,
            saveButton: HTMLElement,
            cancelButton: HTMLElement,
        };
    };
    
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const data = {
            title: this.engine.title,
            html: markdownToHtml(await this.engine.readTodaysMarkdown() ?? ""),
        }; 
        this.container.innerHTML = template(data);
        
        this.elements = {
            view: this.container.querySelector<HTMLElement>("div.view")!,
            text: this.container.querySelector<HTMLElement>("div.text")!,
            editButton: this.container.querySelector<HTMLElement>(".edit")!,
            editorDialog: this.container.querySelector<HTMLDialogElement>("dialog.editor")!,
        };

        const isTodayPopulated = !!data.html;
        (isTodayPopulated ? this.elements.editButton : this.elements.view)
            .addEventListener("click", async e => await this.onEditButtonClick(e));
    }

    private async renderEditor(editorDialog: HTMLDialogElement): Promise<void>
    {
        const markdown: string = await this.engine.readTodaysMarkdown() ?? "";
        const pastItems =
            (await this.engine.readRecentEntries(this.engine.recentItemsToShowInHistory))
            .map(entry => ({
                date: entry.date,
                markdown: entry.value,
                html: markdownToHtml(entry.value),
            }));
        
        const data = {
            today: {
                markdown: markdown,
                html: markdownToHtml(markdown),
            },
            recentItemsToShowInHistory: this.engine.recentItemsToShowInHistory,
            pastItems,
        };

        editorDialog.innerHTML = editorTemplate(data);

        this.elements!.editor = {
            saveButton: editorDialog.querySelector<HTMLElement>(".save")!,
            cancelButton: editorDialog.querySelector<HTMLElement>(".cancel")!,
            textarea: editorDialog.querySelector<HTMLTextAreaElement>("textarea")!,
            preview: editorDialog.querySelector<HTMLElement>("div.preview")!,
            history: editorDialog.querySelector<HTMLElement>(".history")!,
        };

        this.elements!.editor.saveButton.addEventListener("click", async e => await this.onEditorSaveClick(e));
        this.elements!.editor.cancelButton.addEventListener("click", e => this.onEditorCancelClick(e));
        this.elements!.editor.textarea.addEventListener("input", e => this.onEditorTextareaInput(e));
        this.elements!.editorDialog.addEventListener("keydown", e => this.onEditorDialogKeydown(e));
        this.elements!.editor.history.addEventListener("click", e => this.onEditorHistoryClick(e));

        this.elements!.editorDialog.showModal();
        this.elements!.editor.textarea.focus();
    }
    
    private async onEditButtonClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();
        await this.renderEditor(this.elements!.editorDialog);
    }

    private async onEditorSaveClick(e: MouseEvent): Promise<void>
    {
        const newMarkdown = this.elements!.editor!.textarea.value;
        
        await this.engine.saveTodaysMarkdown(newMarkdown);
        this.elements!.editorDialog.close();

        await this.render(/* refreshData */ false);
    }

    private onEditorCancelClick(e: MouseEvent): void
    {
        this.elements!.editorDialog.close();
    }

    private onEditorTextareaInput(e: Event): void
    {
        const target = e.target as HTMLTextAreaElement;
        this.elements!.editor!.preview.innerHTML = markdownToHtml(target.value);
    }

    private onEditorDialogKeydown(e: KeyboardEvent): void
    {
        if ((e.ctrlKey && e.code === "KeyS") ||
            (e.ctrlKey && (e.code === "Enter" || e.key === "Enter")))
        {
            e.preventDefault();
            this.elements!.editor!.saveButton.click();
        }
    }

    private onEditorHistoryClick(e: MouseEvent)
    {
        const targetElement = (e.target as HTMLElement)!;
        
        if (targetElement.classList.contains("copy"))
        {
            const itemElement = targetElement.closest<HTMLElement>("[data-markdown]")!;
            const markdown = itemElement.dataset.markdown!;

            const editorDialog = targetElement.closest<HTMLElement>("dialog")!;
            const textarea = editorDialog.querySelector<HTMLTextAreaElement>("textarea")!;
            textarea.value = markdown;
            textarea.dispatchEvent(new Event("input"));
        }
    }
}

function markdownToHtml(markdown: string): string
{
    return marked(markdown, { breaks: true, async: false });
}