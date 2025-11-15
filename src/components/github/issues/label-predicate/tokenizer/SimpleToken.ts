import TokenType from "app/components/github/issues/label-predicate/tokenizer/TokenType.js";

export default interface SimpleToken
{
    type:
        TokenType.And |
        TokenType.Or |
        TokenType.Not |
        TokenType.LeftParenthesis |
        TokenType.RightParenthesis |
        TokenType.Eof;
}