import Argument from 'app/lib/Argument.js';
import DashboardServices from "app/dashboard/DashboardServices.js";
import Options from "app/components/lightphone/notes/Options.js";
import IStorage from "app/lib/IStorage.js";
import LightClient from "app/components/lightphone/client/LightClient.js";
import Device from "app/components/lightphone/client/Device.js";
import DeviceTool from "app/components/lightphone/client/DeviceTool.js";
import Note from "app/components/lightphone/client/Note.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly deviceId: string;
    public readonly title?: string;
    public readonly accountName: string;
    
    public constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.account)
        {
            throw new Error("lightphone: 'account' attribute is required.");
        }

        if (!options.deviceId)
        {
            throw new Error("lightphone: 'device-id' attribute is required.");
        }

        this.title = options.title;
        this.deviceId = options.deviceId;
        this.accountName = options.account;
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getNotes(/*refreshData*/ true);
    }
    
    public async getNotes(refreshData: boolean): Promise<{ note: Note, text?: string }[]>
    {
        return await this.services.cache.instance.get(
            "notes",
            async () =>
            {
                const client = await this.getClient();
                
                const devices = await client.fetchDevices();
                const matchingDevice: Device|undefined = devices.data.find(d => d.id === this.deviceId);
                if (matchingDevice === undefined)
                {
                    throw new Error(`Device with id '${this.deviceId}' is not listed in the account.`);
                }
                
                const tools = await client.fetchTools(this.deviceId);
                const matchingNoteTools = tools.data.filter(
                    t => t.attributes.namespace === "notes" &&
                         t.attributes.component === "Notes");
                if (matchingNoteTools.length === 0)
                {
                    throw new Error("The notes tool was not returned by the 'tools' endpoint.");
                }
                if (matchingNoteTools.length > 1)
                {
                    throw new Error(
                        `There are ${matchingNoteTools.length} notes ` +
                        `tools available. Exactly one was expected.`);
                }

                const notesTool = matchingNoteTools[0]!;

                const matchingToolInstallations = devices.included!
                    .filter(included => included.type === "device_tools")
                    .map(included => included as DeviceTool)
                    .filter(deviceTool =>
                        deviceTool.relationships.device.data.id === this.deviceId &&
                        deviceTool.relationships.tool.data.id === notesTool.id);
                if (matchingToolInstallations.length == 0)
                {
                    throw new Error("The notes tool is not installed on the device.");
                }
                if (matchingToolInstallations.length > 1)
                {
                    throw new Error(
                        `There are ${matchingToolInstallations.length} notes ` +
                        `tool installations returned by the Light Phone backend. ` +
                        `Exactly one was expected.`);
                }

                const installation = matchingToolInstallations[0]!;

                const notesResponse = await client.fetchNotes(installation.id);
                const notes: Note[] = notesResponse.data;
                
                return await Promise.all(
                    notes.map(async note =>
                    {
                        let text: string|undefined;
                        if (note.attributes.note_type === "text")
                        {
                            const fileUri: string = await client.fetchNoteFileUri(note.id);
                            text = await client.fetchTextNoteContent(fileUri);
                        }
                        
                        return { note, text };
                    }));
            },
            refreshData);
    }
    
    public async deleteNote(noteId: string): Promise<void>
    {
        const client = await this.getClient();
        await client.deleteNote(noteId);
    }
    
    public async getNoteAudioUri(noteId: string): Promise<string>
    {
        const client = await this.getClient();
        return await client.fetchNoteFileUri(noteId);
    }
    
    private async getClient(): Promise<LightClient>
    {
        const accessToken = await this.getAccessToken(this.services.storage, this.accountName);
        return new LightClient(accessToken);
    }
    
    private async getAccessToken(storage: IStorage, accountName: string): Promise<string>
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `lightphone.accounts.${accountName}`;

        let token = await storage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter an access token for LightPhone account ${accountName}`);
            if (!token)
            {
                throw new Error("An access token was not provided by user.");
            }

            await storage.setItem(key, token);
        }

        return token;
    }
}