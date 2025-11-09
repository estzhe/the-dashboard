import Argument from "app/lib/Argument.js";
import TransactionsResponse from "app/components/you-need-a-budget/client/TransactionsResponse.js";
import Transaction from "app/components/you-need-a-budget/client/Transaction.js";

export default class YnabClient
{
    private readonly accessToken: string;

    public constructor(accessToken: string)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        this.accessToken = accessToken;
    }

    public async fetchUnapprovedTransactions(budgetId: string): Promise<Transaction[]>
    {
        Argument.notNullOrUndefinedOrEmpty(budgetId, "budgetId");
        
        const response = await fetch(
            `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions` +
            `?type=unapproved`,
            {
                headers: { "Authorization": `Bearer ${this.accessToken}` },
            });
        if (!response.ok)
        {
            throw new Error(`Error while fetching transactions: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json() as TransactionsResponse;

        return payload.data.transactions;
    }

    public async importNewTransactions(budgetId: string): Promise<void>
    {
        Argument.notNullOrUndefinedOrEmpty(budgetId, "budgetId");

        const response = await fetch(
            `https://api.youneedabudget.com/v1/budgets/${budgetId}/transactions/import`,
            {
                method: 'POST',
                headers: { "Authorization": `Bearer ${this.accessToken}` },
            });
        if (!response.ok)
        {
            throw new Error(`Error while importing new transactions: ${response.status} ${response.statusText}`);
        }
    }
}