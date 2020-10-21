import Argument from '/lib/argument.js';

export default class Google
{
    static getAccessToken(scopes)
    {
        Argument.notNullOrUndefined(scopes, "scopes");

        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true, scopes }, accessToken =>
            {
                if (chrome.runtime.lastError)
                {
                    console.log(chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                }
                else
                {
                    resolve(accessToken);
                }
            });
        });
    }

    static async getEmailAddress()
    {
        const accessToken = await Google.getAccessToken(["email"]);

        const response = await fetch(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
        
        const json = await response.json();

        return json.email;
    }
}
