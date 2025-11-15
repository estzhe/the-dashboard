import TokenType from "app/components/github/issues/label-list/tokenizer/TokenType.js";

export default interface SimpleToken
{
    type:
        TokenType.Comma |
        TokenType.Eof;
}