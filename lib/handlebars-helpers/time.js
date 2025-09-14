export default function (value)
{
    return value.toLocaleString(
        undefined /* current locale */,
        { hour: "numeric", hourCycle: "h23", minute: "numeric" });
}