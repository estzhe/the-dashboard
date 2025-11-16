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
    
    public matches(isMatch: (predicateLabel: string) => boolean): boolean
    {
        return this.matchesCore(this.predicateAst, isMatch);
    }
    
    public toString(indent: number = 0): string
    {
        return JSON
            .stringify(this.predicateAst, null, 4)
            .replace(/^/mg, " ".repeat(indent));
    }
    
    private matchesCore(predicateAst: PredicateAst, isMatch: (predicateLabel: string) => boolean): boolean
    {
        switch (predicateAst.type)
        {
            case PredicateAstNodeType.Label:
                return isMatch(predicateAst.name);

            case PredicateAstNodeType.Not:
                return !this.matchesCore(predicateAst.operand, isMatch);

            case PredicateAstNodeType.And:
                return this.matchesCore(predicateAst.left, isMatch) && this.matchesCore(predicateAst.right, isMatch);

            case PredicateAstNodeType.Or:
                return this.matchesCore(predicateAst.left, isMatch) || this.matchesCore(predicateAst.right, isMatch);

            default:
                throw new Error(`Unknown AST node type: ${(predicateAst as any).type}`);
        }
    }
}