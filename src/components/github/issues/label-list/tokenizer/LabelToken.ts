import TokenType from "app/components/github/issues/label-list/tokenizer/TokenType.js";

export default interface LabelToken
{
    type: TokenType.Label;
    value: string;
}