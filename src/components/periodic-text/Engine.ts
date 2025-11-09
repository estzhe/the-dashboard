import DailyStore from 'app/lib/daily-store/DailyStore.js';
import { Temporal } from '@js-temporal/polyfill';
import Options from "app/components/periodic-text/Options.js";
import DashboardServices from "app/dashboard/DashboardServices.js";
import PlainDate = Temporal.PlainDate;
import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title?: string;
    public readonly recentItemsToShowInHistory: number;
    
    private readonly store: DailyStore<string>;
    
    public constructor(pathToComponent: string, options: Options, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.id)
        {
            throw new Error("periodic-text: 'id' attribute is required.");
        }

        if (options.recentItemsToShowInHistory < 0)
        {
            throw new Error(
                "periodic-text: 'recent-items-to-show-in-history' attribute " +
                "should be equal to or greater than zero.");
        }

        this.title = options.title;
        this.recentItemsToShowInHistory = options.recentItemsToShowInHistory ?? 7;

        this.store = new DailyStore(this.services.storage, `periodic-text-component.${this.id}`);
    }

    public async readTodaysMarkdown(): Promise<string|undefined>
    {
        const today: PlainDate = Temporal.Now.plainDateISO();
        return await this.store.getValue(today);
    }

    public async saveTodaysMarkdown(markdown: string): Promise<void>
    {
        const today: PlainDate = Temporal.Now.plainDateISO();
        await this.store.setValue(today, markdown);
    }

    /**
     * Returns specified number of recent entries, excluding today's, in reverse chronological order.
     */
    public async readRecentEntries(count: number): Promise<SingleDayValue<string>[]>
    {
        const today: PlainDate = Temporal.Now.plainDateISO();
        
        let recent: SingleDayValue<string>[] = await this.store.getRecentItems(count + 1);
        if (recent.length > 0 && recent[0]!.date.equals(today))
        {
            recent = recent.slice(1);
        }

        if (recent.length > count)
        {
            recent = recent.slice(0, count);
        }

        return recent;
    }
}
