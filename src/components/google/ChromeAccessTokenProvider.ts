import IAccessTokenProvider from "app/components/google/client/IAccessTokenProvider.js";
import Argument from "app/lib/Argument.js";
import GetAuthTokenResult = chrome.identity.GetAuthTokenResult;

export default class ChromeAccessTokenProvider implements IAccessTokenProvider
{
    getAccessToken(scopes: string[]): Promise<string>
    {
        Argument.notNullOrUndefined(scopes, "scopes");

        return new Promise((resolve, reject) =>
        {
            chrome.identity.getAuthToken(
                {
                    interactive: true,
                    scopes,
                },
                // @ts-ignore - typings for chrome.identity.getAuthToken callback are wrong.
                (accessToken?: string) =>
                {
                    if (chrome.runtime.lastError)
                    {
                        console.error(
                            `ChromeAccessTokenProvider: could not get an access token: ${chrome.runtime.lastError}`);
                        
                        reject(chrome.runtime.lastError);
                    }
                    else
                    {
                        resolve(accessToken!);
                    }
                });
        });
    }
    
}