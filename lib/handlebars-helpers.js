import "/lib/date.js";
// TODO: replace with just 'handlebars' once https://github.com/handlebars-lang/handlebars.js/pull/1844 gets merged.
import Handlebars from 'handlebars/lib/handlebars.js';

Handlebars.registerHelper("round", Math.round);

Handlebars.registerHelper('ifEquals', (value1, value2, options) =>
    (value1 === value2) ? options.fn(this) : options.inverse(this)
);

Handlebars.registerHelper(
    "date-wordy",
    value => value.toWordyDateString());

Handlebars.registerHelper(
    "time",
    value => `${value.getHours()}:${String(value.getMinutes()).padStart(2, '0')}`);