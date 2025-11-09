import IssueLabel from "app/components/github/client/IssueLabel.js";

export default interface Issue
{
    id: number;
    number: number;

    state: "open" | "closed";
    title: string;
    body: string;
    labels: IssueLabel[];

    created_at: string;
    updated_at: string;

    html_url: string;
}