import Tokenizer from "app/components/github/issues/label-list/tokenizer/Tokenizer";
import TokenType from "app/components/github/issues/label-list/tokenizer/TokenType";

namespace LabelList
{
    export function parse(expression: string): string[]
    {
        const labels: string[] = [];
        
        const tokenizer = new Tokenizer(expression);
        let nextExpectedTokenType: TokenType = TokenType.Label;
        for (let token = tokenizer.next(); token.type !== TokenType.Eof; token = tokenizer.next())
        {
            if (token.type !== nextExpectedTokenType)
            {
                throw new Error(`Unexpected token: ${token.type}. ${nextExpectedTokenType} expected.`);
            }
            
            switch (token.type)
            {
                case TokenType.Label:
                    labels.push(token.value);
                    nextExpectedTokenType = TokenType.Comma;
                    break;
                    
                case TokenType.Comma:
                    nextExpectedTokenType = TokenType.Label;
                    break;
            }
        }
        
        return labels;
    }
}

export default LabelList;