import Argument from "app/lib/Argument.js";
import IssueView from "app/components/github/issues/IssueView.js";
import { default as LabelPredicate, PredicateAst, PredicateAstNodeType }
    from "app/components/github/issues/label-predicate";

export default class IssueFilter
{
    private readonly predicate?: LabelPredicate;

    public static readonly any: Readonly<IssueFilter> = new IssueFilter();

    public constructor(predicate?: string)
    {
        if (predicate)
        {
            this.predicate = new LabelPredicate(predicate.toLowerCase());
        }
    }
    
    public toFilterQuery(): string
    {
        return this.predicate ? toFilterQuery(this.predicate.ast) : "";
    }

    public apply(issues: IssueView[]): IssueView[]
    {
        Argument.notNullOrUndefined(issues, "issues");

        return this.predicate ? issues.filter(issue => this.evaluateForIssue(issue)) : issues;
    }
    
    public evaluateForIssue(issue: IssueView): boolean
    {
        const issueLabels = new Set<string>(issue.labels.map(label => label.name.toLowerCase()));
        return this.predicate!.matches(
            predicateLabel =>
            {
                if (predicateLabel === "due:today")
                {
                    return issue.due?.is_due_today === true || issue.due?.is_past_due === true;
                }
    
                return issueLabels.has(predicateLabel);
            });
    }
}

/**
 * Empty string returned from this function means that predicate cannot be expressed as a Github filter.
 * We treat empty strings as "unknown filter", which cannot participate in constraining filter at all:
 *  - `A and ""` is equivalent to `A`
 *  - `A or ""` is equivalent to `""`
 *  - `not ""` is equivalent to `""`
 */
function toFilterQuery(predicateAst: PredicateAst): string
{
    switch (predicateAst.type)
    {
        case PredicateAstNodeType.Label:
            if (predicateAst.name === "due:today")
            {
                // Github does not support due dates.
                return "";
            }
            
            const escapedLabel = predicateAst.name
                .replace(`\\`, `\\\\`)
                .replace(`"`, `\\"`);
            return `label:"${escapedLabel}"`;

        case PredicateAstNodeType.Not:
        {
            if (predicateAst.operand.type !== PredicateAstNodeType.Label)
            {
                // Github only support negation of labels.
                return "";
            }
            
            const query = toFilterQuery(predicateAst.operand);
            return query ? `-${query}` : "";
        }

        case PredicateAstNodeType.And:
        {
            const left =
                predicateAst.left.type === PredicateAstNodeType.Label ||
                predicateAst.left.type === PredicateAstNodeType.And ||
                predicateAst.left.type === PredicateAstNodeType.Not
                    ? toFilterQuery(predicateAst.left)
                    : `(${toFilterQuery(predicateAst.left)})`;
            const right =
                predicateAst.right.type === PredicateAstNodeType.Label ||
                predicateAst.right.type === PredicateAstNodeType.And ||
                predicateAst.right.type === PredicateAstNodeType.Not
                    ? toFilterQuery(predicateAst.right)
                    : `(${toFilterQuery(predicateAst.right)})`;
            return left && right ? `${left} AND ${right}` : left || right;
        }

        case PredicateAstNodeType.Or:
        {
            const left = toFilterQuery(predicateAst.left);
            const right = toFilterQuery(predicateAst.right);
            return left && right ? `${left} OR ${right}` : "";
        }

        default:
            throw new Error(`Unknown AST node type: ${(predicateAst as any).type}`);
    }
}