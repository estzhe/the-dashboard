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

    static get name() { return "google-mail"; }

    async render()
    {
        const accessToken = await Google.getAccessToken(["https://www.googleapis.com/auth/gmail.readonly"]);

        const ownerEmailAddress = await GoogleMailComponent.#fetchEmailAddress(accessToken);
        const threads = await GoogleMailComponent.#fetchThreads(accessToken);

        const data = {
            title: this.#title,
            ownerEmailAddress,
            threads,
        };
        
        this._container.innerHTML = await this._template("template", data);
    }

    static async #fetchThreads(accessToken)
    {
        Argument.notNullOrUndefined(accessToken, "accessToken");

        const threads = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/threads",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            .then(_ => _.json())
            .then(_ => _.threads);

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

    static async #fetchEmailAddress(accessToken)
    {
        Argument.notNullOrUndefined(accessToken, "accessToken");

        const response = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        
        const json = await response.json();

        return json.emailAddress;
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

// TODO: move to common
function escapeHtml(html)
{
    Argument.notNullOrUndefined(html, "html");

    return html.replace(/&/g, "&amp;")
                .replace(/>/g, "&gt;")
                .replace(/</g, "&lt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
}