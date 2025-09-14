import ReadableTemporalFormat from '/lib/readable-temporal-format.js';
import { Temporal } from '@js-temporal/polyfill';

export default function (value)
{
    const plainDate =
        Temporal.Instant.from(value)
            .toZonedDateTimeISO(Temporal.Now.timeZoneId())
            .toPlainDate();
    return ReadableTemporalFormat.plainDateToString(plainDate);
}