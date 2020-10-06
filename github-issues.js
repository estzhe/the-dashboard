"use strict";

import { getGithubAccount } from './github-accounts.mjs';

document.addEventListener("DOMContentLoaded", () =>
{
    document.getElementById("btnGithubIssues").addEventListener("click", () =>
    {
        const accountName = prompt("Account name");
        const account = getGithubAccount(accountName);

        const repo = prompt("Repository");

        fetch(
            `https://api.github.com/repos/${accountName}/${repo}/issues`,
            {
                headers: {
                    "Accept": "application/vnd.github.v3.raw+json",
                    "Authorization": `Bearer ${account.token}`
                }
            })
        .then(c => c.json())
        .then(
            issues =>
            {
                const html = issues.map(i => `<div>${i.title}</div>`).join("\n");
                
                document.getElementById("divGithubIssues").innerHTML = html;
            });
    });
});