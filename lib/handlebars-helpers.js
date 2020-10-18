Handlebars.registerHelper("round", Math.round);

Handlebars.registerHelper("unix-time", timestamp =>
{
    const date = new Date(timestamp * 1000);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
});

Handlebars.registerHelper("unix-date", timestamp =>
{
    const date = new Date(timestamp * 1000);
    return `${date.getMonth()}/${date.getDate()}`;
});
