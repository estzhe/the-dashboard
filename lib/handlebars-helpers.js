import "/lib/date.js";

Handlebars.registerHelper("round", Math.round);

Handlebars.registerHelper("unix-time", timestamp =>
{
    const date = new Date(timestamp * 1000);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
});

Handlebars.registerHelper("unix-date", timestamp =>
{
    const date = new Date(timestamp * 1000);
    return `${date.getMonth() + 1}/${date.getDate()}`;
});

Handlebars.registerHelper('ifEquals', (value1, value2, options) =>
    (value1 === value2) ? options.fn(this) : options.inverse(this)
);

Handlebars.registerHelper(
    "date-wordy",
    value => value.toWordyDateString());

Handlebars.registerHelper(
    "time",
    value => `${value.getHours()}:${String(value.getMinutes()).padStart(2, '0')}`);