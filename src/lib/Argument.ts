export default class Argument
{
    public static matches(value: string, regex: RegExp, argumentName: string): void
    {
        Argument.notNullOrUndefined(value, argumentName);
        Argument.notNullOrUndefined(regex, "regex");
        Argument.notNullOrUndefined(argumentName, "argumentName");
        
        if (!regex.test(value))
        {
            throw new Error(
                `Argument ${argumentName} is expected to match the regular expression ${regex}, ` +
                `but '${value}' does not.`);
        }
    }

    public static isInstanceOf<T>(value: any, type: new (...args: any[]) => T, argumentName: string): void
    {
        if (argumentName === null)
        {
            throw new Error("Argument 'argumentName' is null.");
        }

        if (!(value instanceof type))
        {
            throw new Error(`Argument ${argumentName} is expected to be an instance of type ${type}.`);
        }
    }

    public static isNumber(value: any, argumentName: string)
    {
        Argument.notNullOrUndefined(value, argumentName);

        if (typeof value !== "number")
        {
            throw new Error(
                `Argument ${argumentName} is expected to be a number, `+
                `while ${typeof value} was provided.`);
        }
    }

    public static min(value: number, min: number, argumentName: string)
    {
        Argument.notNullOrUndefined(value, argumentName);

        if (value < min)
        {
            throw new Error(
                `Argument ${argumentName} is expected to be not less than ${min}, but was ${value}.`);
        }
    }

    public static oneOf(value: any, allowedValues: any[], argumentName: string)
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

    public static collectionNotEmpty(value: any[], argumentName: string)
    {
        Argument.notNullOrUndefined(value, argumentName);

        if (!value.hasOwnProperty("length"))
        {
            throw new Error(`Argument ${argumentName} is expected to be a collection.`);
        }
        
        if (value.length === 0)
        {
            throw new Error(`Argument ${argumentName} has no items, but expected to have some.`);
        }
    }

    public static notNullOrUndefinedOrEmpty(value: any, argumentName: string)
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

    public static notNullOrUndefined(value: any, argumentName: string)
    {
        Argument.notNull(value, argumentName);
        Argument.notUndefined(value, argumentName);
    }

    public static notUndefined(value: any, argumentName: string)
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

    public static notNull(value: any, argumentName: string)
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