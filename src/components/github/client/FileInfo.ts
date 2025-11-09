import Repository from "app/components/github/client/Repository.js";

export default interface FileInfo
{
    readonly repository: Repository;
    readonly branch: string;
    readonly directory: string;
    readonly filename: string;
}
