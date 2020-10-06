export function getGithubAccount(name)
{
    const storage = localStorage;

    if (!storage.getItem("github.accounts"))
    {
        storage.setItem("github.accounts", JSON.stringify({}));
    }

    const accounts = JSON.parse(storage.getItem("github.accounts"));

    if (!accounts[name])
    {
        const token = prompt(`Personal access token for account ${name}`);

        accounts[name] = { name, token };
        storage.setItem("github.accounts", JSON.stringify(accounts));
    }

    return accounts[name];
}
