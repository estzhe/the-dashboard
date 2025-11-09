import Argument from 'app/lib/Argument.js';
import Thread from "app/components/google/client/mail/Thread.js";
import Message from "app/components/google/client/mail/Message.js";
import ThreadView from "app/components/google/mail/ThreadView.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/google/mail/Engine.js";
import template from 'app/components/google/mail/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean): Promise<void>
    {
        await super.render(refreshData); 
        
        const userInfo = await this.engine.getUserInfo(refreshData);
        const threads = await this.engine.getMailThreadsInInbox(refreshData);

        const threadViews = this.toThreadViews(threads);
        
        const data = {
            title: this.engine.title,
            emailAddress: userInfo.email,
            threads: threadViews,
        };
        this.container.innerHTML = template(data);

        for (const action of this.container.querySelectorAll<HTMLElement>(".archive-button"))
        {
            action.addEventListener("click", e => this.onArchiveButtonClick(e));
        }
    }
    
    private async onArchiveButtonClick(e: MouseEvent)
    {
        e.preventDefault();
        
        const targetElement = e.target! as HTMLElement;

        const threadId = targetElement.closest<HTMLElement>(".item")!.dataset.threadId!;
        await this.engine.archiveThread(threadId);

        await this.render(/*refreshData*/ true);
    }

    private toThreadViews(threads: Thread[]): ThreadView[]
    {
        return threads.map(thread =>
        {
            const firstMessage: Message = thread.messages![0]!;
            const headers = Object.fromEntries(firstMessage.payload.headers.map(h => [h.name, h.value]));

            const firstUnreadMessage = thread.messages!.find(m => m.labelIds?.includes("UNREAD") === true);

            return {
                threadId: firstMessage.threadId,
                from: this.parseFrom((headers.From || headers.from)!),
                subject: headers.Subject || headers.subject,
                snippet: (firstUnreadMessage ?? firstMessage).snippet,
                isUnread: firstUnreadMessage !== undefined,
            };
        });
    }

    private parseFrom(from: string): { displayName: string|undefined, email: string }
    {
        Argument.notNullOrUndefined(from, "from");

        if (from.includes("<"))
        {
            const fromRegex = /(?<displayName>[^<]*?)\s*<\s*(?<email>[^>]+?)\s*>/;
            const match = from.match(fromRegex);
            if (match)
            {
                return {
                    displayName: match.groups!.displayName,
                    email: match.groups!.email!,
                };
            }
        }

        return { displayName: undefined, email: from };
    }
}
