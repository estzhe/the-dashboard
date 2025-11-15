import PredicateParser from "app/components/github/issues/label-predicate/parser/PredicateParser.js";
import Tokenizer from "app/components/github/issues/label-predicate/tokenizer/Tokenizer.js";
import PredicateAst from "app/components/github/issues/label-predicate/parser/PredicateAst.js";
import PredicateAstNodeType from "app/components/github/issues/label-predicate/parser/PredicateAstNodeType.js";

export default class LabelPredicate
{
    private readonly predicateAst: PredicateAst;
    
    public constructor(expression: string)
    {
        const tokenizer = new Tokenizer(expression);
        const parser = new PredicateParser(tokenizer);
        this.predicateAst = parser.parse();
    }
    
    public get ast(): Readonly<PredicateAst>
    {
        return this.predicateAst;
    }
    
    public matches(labels: string[]): boolean
    {
        const labelSet = new Set<string>();
        for (const label of labels)
        {
            labelSet.add(label.toLowerCase());
        }
        
        return this.matchesCore(this.predicateAst, labelSet);
    }
    
    public toString(indent: number = 0): string
    {
        return JSON
            .stringify(this.predicateAst, null, 4)
            .replace(/^/mg, " ".repeat(indent));
    }
    
    private matchesCore(predicateAst: PredicateAst, labels: Set<string>): boolean
    {
        switch (predicateAst.type)
        {
            case PredicateAstNodeType.Label:
                return labels.has(predicateAst.name.toLowerCase());

            case PredicateAstNodeType.Not:
                return !this.matchesCore(predicateAst.operand, labels);

            case PredicateAstNodeType.And:
                return this.matchesCore(predicateAst.left, labels) && this.matchesCore(predicateAst.right, labels);

            case PredicateAstNodeType.Or:
                return this.matchesCore(predicateAst.left, labels) || this.matchesCore(predicateAst.right, labels);

            default:
                throw new Error(`Unknown AST node type: ${(predicateAst as any).type}`);
        }
    }
}