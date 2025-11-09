import SimpleAudioPlayer from 'app/components/lightphone/SimpleAudioPlayer.js';
import Note from "app/components/lightphone/client/Note.js";
import NoteView from "app/components/lightphone/notes/NoteView.js";
import {Temporal} from "@js-temporal/polyfill";
import Engine from "app/components/lightphone/notes/Engine.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import ZonedDateTime = Temporal.ZonedDateTime;
import template from 'app/components/lightphone/notes/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const notes = await this.engine.getNotes(refreshData);
        const noteViews = notes
            .map(n => this.toNoteView(n))
            .sort((n1, n2) => ZonedDateTime.compare(n2.timeUpdated, n1.timeUpdated)); // recent first
        
        const data = {
            title: this.engine.title,
            deviceId: this.engine.deviceId,
            notes: noteViews,
        };

        this.container.innerHTML = template(data);

        for (const noteContainer of this.container.querySelectorAll<HTMLElement>(".item"))
        {
            const noteId: string = noteContainer.dataset.id!;

            const doneButton = noteContainer.querySelector<HTMLElement>(".done-button")!;
            doneButton.addEventListener("click", async e => await this.onDoneButtonClick(e));

            const audioContainer = noteContainer.querySelector<HTMLElement>(".audio-container");
            if (audioContainer !== null)
            {
                const downloadButton = noteContainer.querySelector<HTMLElement>(".download-button")!;
                downloadButton.addEventListener("click", async e => await this.onAudioDownloadButtonClick(e));
                
                SimpleAudioPlayer.render(audioContainer, async () => await this.engine.getNoteAudioUri(noteId));
            }
        }
    }
    
    private async onDoneButtonClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();

        const targetElement: HTMLElement = (e.target as HTMLElement)!;
        const noteId: string = targetElement.closest<HTMLElement>(".item")!.dataset.id!;
        
        await this.engine.deleteNote(noteId);

        await this.render(/*refreshData*/ true);
    }
    
    private async onAudioDownloadButtonClick(e: MouseEvent): Promise<void>
    {
        e.preventDefault();
        
        const targetElement: HTMLElement = (e.target as HTMLElement)!;
        const noteId: string = targetElement.closest<HTMLElement>(".item")!.dataset.id!;
        
        const anchor = document.createElement('a');
        anchor.href = await this.engine.getNoteAudioUri(noteId);
        anchor.download = "";
        anchor.click();
    }
    
    private toNoteView({ note, text }: { note: Note, text?: string }): NoteView
    {
        const timeUpdated = Temporal.Instant
            .from(note.attributes.updated_at + "Z")
            .toZonedDateTimeISO(Temporal.Now.timeZoneId());

        return {
            id: note.id,
            type: note.attributes.note_type,
            title: note.attributes.title === "Untitled" ? undefined : note.attributes.title,
            text,
            timeUpdated,
        };
    }
}