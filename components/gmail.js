"use strict";

import { Argument } from '../lib/argument.js';

export class GmailComponent
{
    constructor(container)
    {
        Argument.notNullOrUndefined(container, "container");

        this.container = container;
    }

    static get name() { return "gmail"; }

    async render()
    {
        const ownerEmailAddress = await this.#fetchEmailAddress();

        const threads = await this.#fetchThreads();
        
        this.container.innerHTML = 
            threads.map(thread =>
            {
                return `
                    <div class='thread'>
                        <a href='https://mail.google.com/mail/?authuser=${ownerEmailAddress}#inbox/${thread.threadId}'
                            title='${escapeHtml(thread.snippet)}'
                            style='font-weight: ${thread.isUnread ? "bold" : "normal"}'>
                            ${escapeHtml(thread.from.displayName ?? thread.from.email)}: ${escapeHtml(thread.subject)}
                        </a>
                    </div>`;
            })
            .join("\n");
    }

    #fetchThreads()
    {
        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true }, accessToken =>
            {
                fetch("https://gmail.googleapis.com/gmail/v1/users/me/threads", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                })
                .then(response => response.json()).then(_ => _.threads)
                .then(threads =>
                {
                    const requests = threads.map(
                        thread => fetch(
                            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}` +
                                `?format=METADATA` +
                                `&metadataHeaders=Subject` +
                                `&metadataHeaders=From`,
                            {
                                headers: {
                                    "Authorization": `Bearer ${accessToken}`
                                }
                            })
                            .then(response => response.json()));

                    return Promise.all(requests);
                })
                .then(threads =>
                {
                    const threadFirstMessages = threads.map(thread =>
                    {
                        const firstMessage = thread.messages[0];
                        const headers = Object.fromEntries(firstMessage.payload.headers.map(h => [h.name, h.value]));

                        return {
                            threadId: firstMessage.threadId,
                            from: this.#parseFrom(headers.From),
                            subject: headers.Subject,
                            snippet: firstMessage.snippet,
                            isUnread: firstMessage.labelIds.includes("UNREAD")
                        };
                    });

                    resolve(threadFirstMessages);
                });
            });
        });
    }

    #fetchEmailAddress()
    {
        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true }, accessToken =>
            {
                fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                })
                .then(response => response.json())
                .then(_ => resolve(_.emailAddress));
            });
        });
    }

    #parseFrom(from)
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

function escapeHtml(html)
{
    Argument.notNullOrUndefined(html, "html");

    return html.replace(/&/g, "&amp;")
                .replace(/>/g, "&gt;")
                .replace(/</g, "&lt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
}