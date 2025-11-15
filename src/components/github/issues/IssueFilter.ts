import Argument from "app/lib/Argument.js";
import Issue from "app/components/github/client/Issue.js";
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
            this.predicate = new LabelPredicate(predicate);
        }
    }
    
    public toFilterQuery(): string
    {
        let query = "is:open is:issue sort:updated-desc";
        
        if (this.predicate)
        {
            query += " " + toFilterQuery(this.predicate.ast);
        }

        return query;
    }

    public apply(issues: Issue[]): Issue[]
    {
        Argument.notNullOrUndefined(issues, "issues");

        return this.predicate
            ? issues.filter(issue => this.predicate!.matches(issue.labels.map(label => label.name)))
            : issues;
    }
}

function toFilterQuery(predicateAst: PredicateAst): string
{
    switch (predicateAst.type)
    {
        case PredicateAstNodeType.Label:
            const escapedLabel = predicateAst.name
                .replace(`\\`, `\\\\`)
                .replace(`"`, `\\"`);
            return `label:"${escapedLabel}"`;

        case PredicateAstNodeType.Not:
            return "-" + toFilterQuery(predicateAst.operand);

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
            return `${left} AND ${right}`;
        }

        case PredicateAstNodeType.Or:
        {
            const left = toFilterQuery(predicateAst.left);
            const right = toFilterQuery(predicateAst.right);
            return `${left} OR ${right}`;
        }

        default:
            throw new Error(`Unknown AST node type: ${(predicateAst as any).type}`);
    }
}