"use strict";

export class Argument
{
    static notNullOrUndefinedOrEmpty(value, argumentName)
    {
        Argument.notNullOrUndefined(value, argumentName);
        
        if (typeof value !== "string" && !(value instanceof String))
        {
            throw new Error(`Argument '${argumentName}' is expected to be a string.`);
        }

        if (value.length === 0)
        {
            throw new Error(`Argument '${argumentName} is an empty string.`);
        }
    }

    static notNullOrUndefined(value, argumentName)
    {
        Argument.notNull(value, argumentName);
        Argument.notUndefined(value, argumentName);
    }

    static notUndefined(value, argumentName)
    {
        if (argumentName === null)
        {
            throw new Error("Argument 'argumentName' is null.");
        }

        if (argumentName === undefined)
        {
            throw new Error("Argument 'argumentName' is undefined.");
        }

        if (value === null)
        {
            throw new Error(`Argument '${argumentName}' is null.`);
        }
    }

    static notNull(value, argumentName)
    {
        if (argumentName === null)
        {
            throw new Error("Argument 'argumentName' is null.");
        }

        if (argumentName === undefined)
        {
            throw new Error("Argument 'argumentName' is undefined.");
        }

        if (value === undefined)
        {
            throw new Error(`Argument '${argumentName}' is null.`);
        }
    }
}