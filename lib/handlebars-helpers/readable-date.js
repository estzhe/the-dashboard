import ReadableTemporalFormat from '/lib/readable-temporal-format.js';

export default function (value)
{
    return ReadableTemporalFormat.plainDateToString(value);
}