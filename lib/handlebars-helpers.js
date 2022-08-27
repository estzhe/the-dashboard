// TODO: replace with just 'handlebars' once https://github.com/handlebars-lang/handlebars.js/pull/1844 gets merged.
import Handlebars from 'handlebars/lib/handlebars.js';
import ReadableTemporalFormat from '/lib/readable-temporal-format.js';
import { Temporal } from '@js-temporal/polyfill';

Handlebars.registerHelper("round", Math.round);

Handlebars.registerHelper(
    'ifEquals',
    function (value1, value2, options)
    {
        return (value1 === value2) ? options.fn(this) : options.inverse(this);
    }
);

Handlebars.registerHelper(
    "readable-date",
    value => ReadableTemporalFormat.plainDateToString(value));

Handlebars.registerHelper(
    "time",
    value => value.toLocaleString(
        undefined /* current locale */,
        { hour: "numeric", hourCycle: "h23", minute: "numeric" }));

Handlebars.registerHelper(
    "readable-date-from-utc-datetime-string",
    value =>
    {
        const plainDate =
            Temporal.Instant.from(value)
                .toZonedDateTimeISO(Temporal.Now.timeZone())
                .toPlainDate();
        return ReadableTemporalFormat.plainDateToString(plainDate);
    });

Handlebars.registerHelper(
    "toString",
    value => value?.toString());