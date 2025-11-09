import Argument from "app/lib/Argument.js";
import Device from "app/components/lightphone/client/Device.js";
import LightResponse from "app/components/lightphone/client/LightResponse.js";
import Tool from "app/components/lightphone/client/Tool.js";
import Note from "app/components/lightphone/client/Note.js";

export default class LightClient
{
    private readonly accessToken: string;

    constructor(accessToken: string)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.accessToken = accessToken;
    }

    public async fetchTextNoteContent(fileUri: string): Promise<string>
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
            const response = await fetch(fileUri);
            return response.text();
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

    public async deleteNote(noteId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(noteId, "noteId");

        await fetch(
            `https://production.lightphonecloud.com/api/notes/${noteId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                },
            }
        );
    }

    /**
     * Fetches a file URI associated with a note.
     * 
     * The URI expires after some time, but does not require an authentication header -
     * everything needed is already embedded into it.
     */
    public async fetchNoteFileUri(noteId: string): Promise<string>
    {
        Argument.notNullOrUndefinedOrEmpty(noteId, "noteId");

        const response = await fetch(
            `https://production.lightphonecloud.com/api/notes/${noteId}/generate_presigned_get_url`,
            {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            });
        
        const payload = await response.json();
        return payload.presigned_get_url;
    }

    /**
     * Fetches notes on a single device.
     * 
     * @param deviceToolId : string - identifier of an object that represents association
     * between a device and the notes tool.
     */
    public async fetchNotes(deviceToolId: string): Promise<LightResponse<Note>>
    {
        Argument.notNullOrUndefinedOrEmpty(deviceToolId, "deviceToolId");

        const response = await fetch(
            `https://production.lightphonecloud.com/api/notes?device_tool_id=${deviceToolId}`,
            {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            });
        
        return await response.json();
    }

    /**
     * Fetches all devices for the user associated with the access token.
     */
    public async fetchDevices(): Promise<LightResponse<Device>>
    {
        const response =  await fetch(
            `https://production.lightphonecloud.com/api/devices`,
            {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            });
        
        return await response.json();
    }

    /**
     * Fetches information about all tools supported by the Light Phone on a particular device.
     */
    public async fetchTools(deviceId: string): Promise<LightResponse<Tool>>
    {
        Argument.notNullOrUndefinedOrEmpty(deviceId, "deviceId");

        const response = await fetch(
            `https://production.lightphonecloud.com/api/tools?device_id=${deviceId}`,
            {
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                }
            });
        
        return await response.json();
    }
}