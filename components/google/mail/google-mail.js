import Argument from '/lib/argument.js';
import Google from '/components/google/google.js';
import BaseComponent from '/components/base-component.js';

export default class GoogleMailComponent extends BaseComponent
{
    #title;

    constructor(root, container)
    {
        super(root, container);

        this.#title = container.getAttribute("title");
    }

    async render(refresh)
    {
        const { emailAddress, threads } = await this._services.cache.get(
            "emails",
            async () =>
            {
                const accessToken = await Google.getAccessToken(["https://www.googleapis.com/auth/gmail.readonly"]);

                const emailAddress = await Google.getEmailAddress();
                const threads = await GoogleMailComponent.#fetchThreads(accessToken);

                return { emailAddress, threads };
            },
            refresh);

        await this.#renderEmails(emailAddress, threads);
    }

    async #renderEmails(emailAddress, threads)
    {
        const data = {
            title: this.#title,
            emailAddress,
            threads,
        };
        
        this._container.innerHTML = await this._template("template", data);
    }

    static async #fetchThreads(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const threads = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads` +
                `?includeSpamTrash=false` +
                `&labelIds=INBOX`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            .then(_ => _.json())
            .then(_ => _.threads) ?? [];

        const threadDetails = await Promise.all(
            threads.map(thread =>
                fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}` +
                        `?format=METADATA` +
                        `&metadataHeaders=Subject` +
                        `&metadataHeaders=From`,
                    {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        }
                    })
                .then(response => response.json())
            )
        );

        const threadFirstMessages = threadDetails.map(thread =>
        {
            const firstMessage = thread.messages[0];
            const headers = Object.fromEntries(firstMessage.payload.headers.map(h => [h.name, h.value]));

            return {
                threadId: firstMessage.threadId,
                from: GoogleMailComponent.#parseFrom(headers.From),
                subject: headers.Subject,
                snippet: firstMessage.snippet,
                isUnread: firstMessage.labelIds.includes("UNREAD")
            };
        });

        return threadFirstMessages;
    }

    static #parseFrom(from)
    {
        Argument.notNullOrUndefined(from, "from");

        const fromRegex = /(?<displayName>[^<]*?)\s*<\s*(?<email>[^>]+?)\s*>/;
        if (from.includes("<"))
        {
            const match = from.match(fromRegex);
            if (match)
            {
                const { displayName, email } = match.groups;
                return { displayName, email };
            }
        }

        return { displayName: null, email: from };
    }
}
