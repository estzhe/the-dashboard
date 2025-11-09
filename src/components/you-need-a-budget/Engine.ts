import Argument from 'app/lib/Argument.js';
import DashboardServices from "app/dashboard/DashboardServices.js";
import Option from "app/components/you-need-a-budget/Option.js";
import Transaction from "app/components/you-need-a-budget/client/Transaction.js";
import IStorage from "app/lib/IStorage.js";
import YnabClient from "app/components/you-need-a-budget/client/YnabClient.js";
import BaseComponentEngine from "app/components/BaseComponentEngine.js";

export default class Engine extends BaseComponentEngine
{
    public readonly title?: string;
    public readonly accountName: string;
    public readonly budgetId: string;

    public constructor(pathToComponent: string, options: Option, services: DashboardServices)
    {
        super(pathToComponent, options, services);

        if (!options.account)
        {
            throw new Error("you-need-a-budget: 'account' attribute is required.");
        }

        if (!options.budgetId)
        {
            throw new Error("you-need-a-budget: 'budget-id' attribute is required.");
        }

        this.title = options.title;
        this.accountName = options.account;
        this.budgetId = options.budgetId;
    }

    public override async refreshData(): Promise<void>
    {
        await super.refreshData();
        await this.getUnapprovedTransactions(/*refreshData*/ true);
    }
    
    public async getUnapprovedTransactions(refreshData: boolean): Promise<Transaction[]>
    {
        return await this.services.cache.instance.get(
            "transactions",
            async() =>
            {
                const client = await this.getClient();

                await client.importNewTransactions(this.budgetId);
                return await client.fetchUnapprovedTransactions(this.budgetId);
            },
            refreshData);
    }
    
    private async getClient(): Promise<YnabClient>
    {
        const accessToken = await Engine.getPersonalAccessToken(this.services.storage, this.accountName);
        return new YnabClient(accessToken);
    }

    private static async getPersonalAccessToken(storage: IStorage, accountName: string): Promise<string>
    {
        Argument.notNullOrUndefined(storage, "storage");
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `you-need-a-budget.accounts.${accountName}`;

        let token = await storage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for You Need a Budget account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            await storage.setItem(key, token);
        }

        return token;
    }
}