import { Marked } from 'marked';
import { baseUrl as markedBaseUrl } from 'marked-base-url';
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/github/markdown/Engine.js";
import template from 'app/components/github/markdown/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData);

        const baseUrl = `https://github.com/${this.engine.file.repository.owner}` +
            `/${this.engine.file.repository.name}/blob` +
            `/${this.engine.file.branch}` +
            `/${this.engine.file.directory}`;
        const editUrl = `https://github.com/${this.engine.file.repository.owner}` +
            `/${this.engine.file.repository.name}/edit` +
            `/${this.engine.file.branch}` +
            `/${this.engine.file.directory}${this.engine.file.filename}`;

        const markdown = await this.engine.getFileContent(refreshData);
        const html = new Marked().use(markedBaseUrl(baseUrl)).parse(markdown, { async: false });

        const data = { editUrl, html };
        this.container.innerHTML = template(data);
    }
}