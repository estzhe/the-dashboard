if (!Date.today)
{
    Date.today = () => new Date().startOfDay();

    Date.tomorrow = () => Date.today().addDays(1);

    Date.yesterday = () => Date.today().addDays(-1);

    Date.prototype.addDays = function(days)
    {
        const date = new Date(this);
        date.setDate(date.getDate() + days);
        return date;
    };

    Date.prototype.startOfDay = function()
    {
        const date = new Date(this);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    Date.prototype.endOfDay = function()
    {
        const date = new Date(this);
        date.setHours(23, 59, 59, 999);
        return date;
    };

    Date.prototype.toWordyDateString = function()
    {
        const now = new Date();
        
        if (this.getFullYear() !== now.getFullYear())
        {
            return this.toLocaleDateString();
        }

        if (this < Date.yesterday())
        {
            return `${this.getMonth() + 1}/${this.getDate()}`;
        }

        if (this < Date.today())
        {
            return "yesterday";
        }

        if (this < Date.tomorrow())
        {
            return "today";
        }

        if (this < Date.tomorrow().addDays(1))
        {
            return "tomorrow";
        }

        return `${this.getMonth() + 1}/${this.getDate()}`;
    };
}