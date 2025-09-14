import Argument from '/lib/argument.js';

export default class Github
{
    static async getPersonalAccessToken(storage, accountName)
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `github.accounts.${accountName}`;

        let token = await storage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for GitHub account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            await storage.setItem(key, token);
        }

        return token;
    }
}
