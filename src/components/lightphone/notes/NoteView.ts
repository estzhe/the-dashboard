import Note from "app/components/lightphone/client/Note.js";
import {Temporal} from "@js-temporal/polyfill";

export default interface NoteView
{
    id: string,
    type: Note["attributes"]["note_type"],
    title?: string,
    text?: string,
    timeUpdated: Temporal.ZonedDateTime,
}