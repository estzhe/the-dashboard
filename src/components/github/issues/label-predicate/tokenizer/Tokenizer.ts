import Token from "app/components/github/issues/label-predicate/tokenizer/Token.js";
import TokenType from "app/components/github/issues/label-predicate/tokenizer/TokenType.js";
import LabelToken from "app/components/github/issues/label-predicate/tokenizer/LabelToken.js";

export default class Tokenizer
{
    private readonly input: string;
    private position: number;
    
    public constructor(input: string)
    {
        this.input = input;
        this.position = 0;
    }

    public peek(): Token
    {
        const mark = this.position;
        const token = this.next();
        this.position = mark;
        return token;
    }

    public next(): Token
    {
        this.skipWhitespace();

        if (this.position >= this.input.length)
        {
            return { type: TokenType.Eof };
        }

        switch (this.input[this.position])
        {
            case "(":
                this.position++;
                return { type: TokenType.LeftParenthesis };
                
            case ")":
                this.position++;
                return { type: TokenType.RightParenthesis };
                
            case "-":
                this.position++;
                return { type: TokenType.Not };
                
            case '"':
                return this.readQuotedLabel();
                
            default:
                return this.readWordToken();
        }
    }

    private skipWhitespace()
    {
        while (this.position < this.input.length && this.isWhitespace(this.input[this.position]!))
        {
            this.position++;
        }
    }
    
    private isWhitespace(char: string): boolean
    {
        return char === " " ||
            char === "\t" ||
            char === "\n" ||
            char === "\r";
    }

    private readQuotedLabel(): LabelToken
    {
        if (this.input[this.position] !== '"')
        {
            throw new Error("Expected opening quote");
        }
        
        this.position++; // skip opening quote
        
        let result = "";
        while (this.position < this.input.length)
        {
            const char = this.input[this.position];

            if (char === '"')
            {
                this.position++;
                return { type: TokenType.Label, value: result };
            }
            
            const isEscapeSequence = char === "\\";
            if (isEscapeSequence)
            {
                if (this.position + 1 >= this.input.length)
                {
                    throw new Error("Unfinished escape sequence in quoted label.");
                }

                const next = this.input[this.position + 1];
                if (next !== '"' && next !== "\\")
                {
                    throw new Error("Unknown escape sequence in quoted label.");
                }

                result += next;
                this.position += 2;
            }
            else
            {
                result += char;
                this.position++;
            }
        }
        
        throw new Error("Unterminated quoted label");
    }

    private readWordToken(): Token
    {
        let start = this.position;

        while (
            this.position < this.input.length &&
            !this.isWhitespace(this.input[this.position]!) &&
            !["(", ")", '"'].includes(this.input[this.position]!))
        {
            this.position++;
        }

        const word= this.input.slice(start, this.position);
        switch (word.toLowerCase())
        {
            case "and": return { type: TokenType.And };
            case "or": return { type: TokenType.Or };
            case "not": return { type: TokenType.Not };
            default: return { type: TokenType.Label, value: word };
        }
    }
}