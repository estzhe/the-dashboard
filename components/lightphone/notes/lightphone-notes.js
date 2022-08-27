import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import SimpleAudioPlayer from '/components/lightphone/simple-audio-player.js';
import { Temporal } from '@js-temporal/polyfill';

export default class LightPhoneNotesComponent extends BaseComponent
{
    #accountName;
    #deviceId;
    #title;
    
    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.account)
        {
            throw new Error("lightphone: 'account' attribute is required.");
        }

        if (!options.deviceId)
        {
            throw new Error("lightphone: 'device-id' attribute is required.");
        }

        this.#title = options.title;
        this.#accountName = options.account;
        this.#deviceId = options.deviceId;
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const notes = await this.#getNotes(refreshData);
        await this.#renderNotes(container, notes);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getNotes(/* refreshData */ true);
    }

    async #renderNotes(container, notes)
    {
        const data = {
            title: this.#title,
            deviceId: this.#deviceId,
            notes,
        };

        container.innerHTML = await this._template("template", data);

        for (const noteContainer of container.querySelectorAll(".item"))
        {
            const noteId = noteContainer.dataset.id;

            const audioContainer = noteContainer.querySelector(".audio-container");
            if (audioContainer !== null)
            {
                const getUriAsync = async () =>
                {
                    const accessToken = LightPhoneNotesComponent.#getAccessToken(this.#accountName);
                    return LightPhoneNotesComponent.#fetchNoteFileUri(noteId, accessToken);
                };

                SimpleAudioPlayer.render(audioContainer, getUriAsync);

                noteContainer.querySelector(".download-button").addEventListener(
                    "click",
                    async () =>
                    {
                        const anchor = document.createElement('a');
                        anchor.href = await getUriAsync();
                        anchor.download = "";
                        anchor.click();
                    });
            }

            noteContainer.querySelector(".done-button").addEventListener(
                "click",
                async () =>
                {
                    const accessToken = LightPhoneNotesComponent.#getAccessToken(this.#accountName);
                    await LightPhoneNotesComponent.#deleteNote(noteId, accessToken);
    
                    await this.render(container, /*refreshData*/ true);
                });
        }
    }

    async #getNotes(refreshData)
    {
        return await this._services.cache.get(
            "notes",
            async () =>
            {
                const accessToken = LightPhoneNotesComponent.#getAccessToken(this.#accountName);
                
                const tools = await LightPhoneNotesComponent.#fetchTools(accessToken);
                const matchingNoteTools = tools.data.filter(
                    t => t.attributes.namespace === "notes" &&
                         t.attributes.component === "Notes");

                if (matchingNoteTools.length == 0)
                {
                    throw new Error(
                        "The notes tool was not returned by the 'tools' endpoint.");
                }

                if (matchingNoteTools.length > 1)
                {
                    throw new Error(
                        `There are ${matchingNoteTools.length} notes ` +
                        `tools available. Exactly one was expected.`);
                }

                const notesTool = matchingNoteTools[0];

                const devices = await LightPhoneNotesComponent.#fetchDevices(accessToken);
                const matchingDevice = devices.data.find(d => d.id === this.#deviceId);
                if (matchingDevice === null)
                {
                    throw new Error(
                        `Device with id '${this.#deviceId}' is not listed in the account.`);
                }

                const matchingToolInstallations = devices.included.filter(
                    included => included.type === "device_tools" &&
                                included.relationships.device.data.id === this.#deviceId &&
                                included.relationships.tool.data.id === notesTool.id);
                
                if (matchingToolInstallations.length == 0)
                {
                    throw new Error(
                        "The notes tool is not installed on the device.");
                }

                if (matchingToolInstallations.length > 1)
                {
                    throw new Error(
                        `There are ${matchingToolInstallations.length} notes ` +
                        `tool installations returned by the Light Phone backend. ` +
                        `Exactly one was expected.`);
                }

                const installation = matchingToolInstallations[0];

                const notes = await LightPhoneNotesComponent.#fetchNotes(
                    installation.id, accessToken);
                
                return (await Promise.all(notes.data.map(async note =>
                {
                    // Through experimentation it was found out that attributes.updated_at is in UTC,
                    // but it does not have any timezone information attached to it, nor "Z" at the end.
                    const timeUpdated = note.attributes.updated_at + "Z";

                    let text = null;
                    if (note.attributes.note_type === "text")
                    {
                        const fileUri = await LightPhoneNotesComponent.#fetchNoteFileUri(note.id, accessToken);
                        text = await LightPhoneNotesComponent.#fetchTextNoteContent(fileUri);
                    }

                    return {
                        id: note.id,
                        type: note.attributes.note_type,    // audio|text
                        title: note.attributes.title === "Untitled" ? null : note.attributes.title,
                        text,
                        timeUpdated,
                    };
                })))
                .sort((n1, n2) => n1.timeUpdated.localeCompare(n2.timeUpdated));
            },
            refreshData);
    }

    static async #fetchTextNoteContent(fileUri)
    {
        Argument.notNullOrUndefinedOrEmpty(fileUri, "fileUri");

        // LightPhone stores note files in DigitalOcean with CORS policy set to only
        // allow requests from LightPhone dashboard. Thus we can't make these requests
        // directly from the extension new tab page. But we can make them from extension's
        // background scripts, as Chrome does not enforce CORS policy in them.
        //
        // This method could be called from both background script during periodic data
        // refresh, as well as from new tab page when user requests a refresh.
        //
        // When this method is called from new tab page, we need to ask background script
        // to fetch the file contents. We do that through sending a message to the background
        // script.
        //
        // When this method is called from background script, we can't send a message, because
        // Chrome does not allow a script to send messages to itself. In this case we need to
        // directly fetch the file contents.
        const isBackgroundScript = chrome.extension.getBackgroundPage() === window;
        if (isBackgroundScript)
        {
            return await fetch(fileUri).then(_ => _.text());
        }
        else
        {
            return new Promise(
                resolve =>
                {
                    chrome.runtime.sendMessage(
                        {
                            type: "cors-bypass.lightphone.notes.fetch-text-note-content",
                            uri: fileUri,
                        },
                        resolve);
                });
        }
    }

    static async #deleteNote(noteId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(noteId, "noteId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        await fetch(
            `https://production.lightphonecloud.com/api/notes/${noteId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );
    }

    /**
     * Fetches a file URI associated with a note. The URI expires after some time, but does
     * not require an authentication header - everything needed is already embedded into it.
     */
    static async #fetchNoteFileUri(noteId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(noteId, "noteId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://production.lightphonecloud.com/api/notes/${noteId}/generate_presigned_get_url`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());
        
        return response.presigned_get_url;
    }

    /**
     * Fetches notes. The installationId is an identifier of
     * an object that represents association between a device
     * and the notes tool (also called "device_tool").
     */
    static async #fetchNotes(installationId, accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(installationId, "installationId");
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        return await fetch(
            `https://production.lightphonecloud.com/api/notes?device_tool_id=${installationId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());
    }

    /**
     * Fetches all devices.
     */
    static async #fetchDevices(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        return await fetch(
            `https://production.lightphonecloud.com/api/devices`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());
    }

    /**
     * Fetches information about all tools supported by the Light Phone.
     * This is not specific to any particular device.
     */
    static async #fetchTools(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        return await fetch(
            `https://production.lightphonecloud.com/api/tools`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            })
            .then(_ => _.json());
    }

    static #getAccessToken(accountName)
    {
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `lightphone.accounts.${accountName}`;

        let token = localStorage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter an access token for LightPhone account ${accountName}`);
            if (!token)
            {
                throw new Error("An access token was not provided by user.");
            }

            localStorage.setItem(key, token);
        }

        return token;
    }
}