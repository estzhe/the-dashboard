import ReadableTemporalFormat from 'app/lib/ReadableTemporalFormat.js';

export default function (value)
{
    return ReadableTemporalFormat.plainDateToString(value);
}