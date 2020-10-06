"use strict";

import { getGithubAccount } from './github-accounts.mjs';

document.addEventListener("DOMContentLoaded", () =>
{
    document.getElementById("btnGithub").addEventListener("click", () =>
    {
        const documentUri = prompt("Document URI");
        const accountName = prompt("Account to use");

        getDocumentContent(documentUri, accountName).then(
            text =>
            {
                const markdown = renderMarkdown(text);
                
                console.log(markdown);

                document.getElementById("divGithub").innerHTML = markdown;
            });
    });
});

function renderMarkdown(text)
{
    return marked(text);
}

function getDocumentContent(documentUri, accountName)
{
    const documentUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<branch>[^\/]+)\/(?<path>.+)/i;
    const match = documentUriRegex.exec(documentUri);
    if (!match)
    {
        alert("Document URI is in unexpected format.");
    }

    const document = match.groups;

    const account = getGithubAccount(accountName);

    return fetch(
        `https://api.github.com/repos/${document.owner}/${document.repo}/contents/${document.path}?ref=${document.branch}`,
        {
            headers: {
                "Accept": "application/vnd.github.v3.raw",
                "Authorization": `Bearer ${account.token}`
            }
        })
    .then(c => c.text());
}
