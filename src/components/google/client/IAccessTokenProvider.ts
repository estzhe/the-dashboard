export default interface IAccessTokenProvider
{
    getAccessToken: (scopes: string[]) => Promise<string>;
}