import PredicateAst from "app/components/github/issues/label-predicate/parser/PredicateAst.js";
import PredicateAstNodeType from "app/components/github/issues/label-predicate/parser/PredicateAstNodeType.js";
import TokenType from "app/components/github/issues/label-predicate/tokenizer/TokenType.js";
import Token from "app/components/github/issues/label-predicate/tokenizer/Token.js";
import Tokenizer from "app/components/github/issues/label-predicate/tokenizer/Tokenizer.js";
import LabelToken from "app/components/github/issues/label-predicate/tokenizer/LabelToken.js";

export default class PredicateParser
{
    private nextToken: Token;
    private readonly tokenizer: Tokenizer;

    public constructor(tokenizer: Tokenizer)
    {
        this.tokenizer = tokenizer;
        this.nextToken = tokenizer.next();
    }

    public parse(): PredicateAst
    {
        const expr = this.parseOr();
        this.consume(TokenType.Eof);
        return expr;
    }

    // OR := AND ( OR AND )*
    private parseOr(): PredicateAst
    {
        let left = this.parseAnd();
        while (this.nextToken.type === TokenType.Or)
        {
            this.consume(TokenType.Or);
            const right = this.parseAnd();
            left = { type: PredicateAstNodeType.Or, left, right };
        }
        return left;
    }

    // AND := UNARY ( AND UNARY )*
    private parseAnd(): PredicateAst
    {
        let left = this.parseUnary();
        while (this.nextToken.type === TokenType.And)
        {
            this.consume(TokenType.And);
            const right = this.parseUnary();
            left = { type: PredicateAstNodeType.And, left, right };
        }
        return left;
    }

    // UNARY := (NOT | '-') UNARY | PRIMARY
    private parseUnary(): PredicateAst
    {
        if (this.nextToken.type === TokenType.Not)
        {
            this.consume(TokenType.Not);
            const operand = this.parseUnary();
            return { type: PredicateAstNodeType.Not, operand };
        }
        
        return this.parsePrimary();
    }

    // PRIMARY := LABEL | '(' OR ')'
    private parsePrimary(): PredicateAst
    {
        if (this.nextToken.type === TokenType.Label)
        {
            const token = this.consume(TokenType.Label) as LabelToken;
            return { type: PredicateAstNodeType.Label, name: token.value };
        }
        
        if (this.nextToken.type === TokenType.LeftParenthesis)
        {
            this.consume(TokenType.LeftParenthesis);
            const expression = this.parseOr();
            this.consume(TokenType.RightParenthesis);
            
            return expression;
        }
        
        this.error(`Expected a label or '(' but found ${this.describe(this.nextToken)}`);
    }

    private consume(expectedTokenType: TokenType): Token
    {
        const currentToken = this.nextToken;
        if (expectedTokenType && currentToken.type !== expectedTokenType)
        {
            this.error(`Expected ${expectedTokenType} but found ${this.describe(currentToken)}`);
        }
        
        this.nextToken = this.tokenizer.next();
        return currentToken;
    }

    private describe(token: Token): string
    {
        switch (token.type)
        {
            case TokenType.Label:
                return `LABEL(${JSON.stringify(token.value)})`;
            default:
                return token.type;
        }
    }

    private error(message: string): never
    {
        throw new Error(`Parse error: ${message}`);
    }
}
