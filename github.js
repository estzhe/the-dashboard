"use strict";

document.addEventListener("DOMContentLoaded", () =>
{
    document.getElementById("btnGithub").addEventListener("click", () =>
    {
        const documentUri = prompt("Document URI");
        getDocumentContent(documentUri).then(text => console.log(text));
    });
});

function getDocumentContent(documentUri)
{
    const storage = localStorage;

    if (!storage.getItem("github.accounts"))
    {
        const name = prompt("Account name");
        const token = prompt("Personal access token");

        storage.setItem("github.accounts", JSON.stringify([{ name, token }]));
    }

    const account = JSON.parse(storage.getItem("github.accounts"))[0];

    const documentUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/blob\/(?<branch>[^\/]+)\/(?<path>.+)/i;
    const match = documentUriRegex.exec(documentUri);
    if (!match)
    {
        alert("Document URI is in unexpected format.");
    }

    const document = match.groups;

    return fetch(
        `https://api.github.com/repos/${document.owner}/${document.repo}/contents/${document.path}?ref=${document.branch}`,
        {
            headers: {
                "Accept": "application/vnd.github.VERSION.raw",
                "Authorization": `Bearer ${account.token}`
            }
        })
    .then(c => c.text());
}