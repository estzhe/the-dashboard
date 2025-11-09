import ReadableTemporalFormat from 'app/lib/ReadableTemporalFormat.js';
import { Temporal } from '@js-temporal/polyfill';

export default function (value)
{
    const plainDateTime =
        Temporal.Instant.from(value)
            .toZonedDateTimeISO(Temporal.Now.timeZoneId())
            .toPlainDateTime();
    
    return ReadableTemporalFormat.plainDateTimeToString(plainDateTime);
}