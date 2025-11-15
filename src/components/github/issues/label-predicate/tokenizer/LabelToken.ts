import TokenType from "app/components/github/issues/label-predicate/tokenizer/TokenType.js";

export default interface LabelToken
{
    type: TokenType.Label;
    value: string;
}