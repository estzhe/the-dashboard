export default class Argument
{
    static oneOf(value, allowedValues, argumentName)
    {
        Argument.notNullOrUndefined(value, argumentName);
        Argument.collectionNotEmpty(allowedValues, "allowedValues");
        
        if (!allowedValues.includes(value))
        {
            throw new Error(
                `Argument ${argumentName} is expected to be one of '${allowedValues.join(",")}', ` +
                `while its value is '${value}'.`)
        }
    }

    static collectionNotEmpty(value, argumentName)
    {
        Argument.notNullOrUndefined(value, argumentName);

        if (!value.hasOwnProperty("length"))
        {
            throw new Error(`Argument ${argumentName} is expected to be a collection.`);
        }
    }

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