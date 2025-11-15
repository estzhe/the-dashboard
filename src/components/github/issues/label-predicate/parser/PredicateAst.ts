import PredicateAstNodeType from "app/components/github/issues/label-predicate/parser/PredicateAstNodeType";

type PredicateAst =
    | { type: PredicateAstNodeType.Label; name: string }
    | { type: PredicateAstNodeType.Not; operand: PredicateAst }
    | { type: PredicateAstNodeType.And; left: PredicateAst; right: PredicateAst }
    | { type: PredicateAstNodeType.Or; left: PredicateAst; right: PredicateAst };

export default PredicateAst;