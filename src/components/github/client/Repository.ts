import Argument from "app/lib/Argument.js";

export default abstract class Repository
{
    abstract owner: string;
    abstract name: string;

    static fromUri(uri: string): Repository
    {
        Argument.notNullOrUndefinedOrEmpty(uri, "uri");

        const repoUriRegex = /github\.com\/(?<owner>[^\/]+)\/(?<name>[^\/]+)/i;
        const match = repoUriRegex.exec(uri);
        if (!match)
        {
            throw new Error(`Repository URI is in unexpected format: ${uri}.`);
        }

        return {
            owner: match.groups!.owner!,
            name: match.groups!.name!,
        };
    }
}