import Argument from "app/lib/Argument.js";
import Issue from "app/components/github/client/Issue.js";

export default class IssueFilter
{
    include: string[];
    exclude: string[];
    
    constructor(options?: { include?: string[], exclude?: string[] })
    {
        this.include = options?.include ?? [];
        this.exclude = options?.exclude ?? [];
    }

    static readonly empty: Readonly<IssueFilter> = new IssueFilter();
    
    static fromExpression(filterExpression: string) : IssueFilter
    {
        Argument.notNullOrUndefined(filterExpression, "filterExpression");

        const expressions = filterExpression.split(/\s+/);

        const include: string[] = [];
        const exclude: string[] = [];
        for (const expression of expressions)
        {
            if (expression.startsWith("-"))
            {
                if (expression.length === 1)
                {
                    throw new Error(
                        `An exclusion filtering expression must include a label to exclude after '-' character. ` +
                        `Filter expression: '${expression}'.`);
                }

                const label = expression.substring(1);
                exclude.push(label);
            }
            else
            {
                include.push(expression);
            }
        }

        return new IssueFilter({ include, exclude });
    }
    
    toQuery(): string
    {
        let query = "is:open is:issue";
        
        if (this.include.length !== 0)
        {
            query += " label:" + this.include.join(",");
        }
        
        if (this.exclude.length !== 0)
        {
            query += " " + this.exclude.map(label => `-label:${label}`).join(" ");
        }
        
        return query;
    }
    
    apply(issues: Issue[]): Issue[]
    {
        Argument.notNullOrUndefined(issues, "issues");

        if (this.include.length !== 0)
        {
            // include if contains any of includes
            issues = issues.filter(
                issue => this.include.some(
                    targetLabel => issue.labels.some(label => label.name === targetLabel)));
        }
        if (this.exclude.length !== 0)
        {
            // exclude if contains any of excludes
            issues = issues.filter(
                issue => this.exclude.every(
                    targetLabel => issue.labels.every(label => label.name !== targetLabel)));
        }

        return issues;
    }
}