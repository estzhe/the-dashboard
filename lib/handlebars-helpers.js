// TODO: replace with just 'handlebars' once https://github.com/handlebars-lang/handlebars.js/pull/1844 gets merged.
import Handlebars from 'handlebars/lib/handlebars.js';
import ReadableTemporalFormat from '/lib/readable-temporal-format.js';

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
    "toString",
    value => value?.toString());