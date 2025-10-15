import ReadableTemporalFormat from 'app/lib/readable-temporal-format.js';

export default function (value)
{
    return ReadableTemporalFormat.plainDateToString(value);
}