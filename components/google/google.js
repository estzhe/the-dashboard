import Argument from '/lib/argument.js';

export default class Google
{
    static getAccessToken(scopes)
    {
        Argument.collectionNotEmpty(scopes, "scopes");

        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken({ interactive: true, scopes }, accessToken =>
            {
                if (chrome.runtime.lastError)
                {
                    reject(chrome.runtime.lastError);
                }
                else
                {
                    resolve(accessToken);
                }
            });
        });
    }
}
