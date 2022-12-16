import Argument from '/lib/argument.js';
import BaseComponent from '/components/base-component.js';
import { Temporal } from '@js-temporal/polyfill';

export default class YouNeedABudgetComponent extends BaseComponent
{
    #title;
    #accountName;
    #budgetId;

    constructor(pathToComponent, options)
    {
        super(pathToComponent, options);

        if (!options.account)
        {
            throw new Error("you-need-a-budget: 'account' attribute is required.");
        }

        if (!options.budgetId)
        {
            throw new Error("you-need-a-budget: 'budget-id' attribute is required.");
        }

        this.#title = options.title;
        this.#accountName = options.account;
        this.#budgetId = options.budgetId;
    }

    async render(container, refreshData)
    {
        await super.render(container, refreshData);

        const transactions = await this.#getUnapprovedTransactions(refreshData);
        await this.#renderTransactions(container, transactions);
    }

    async refreshData()
    {
        await super.refreshData();
        await this.#getUnapprovedTransactions(/* refreshData */ true);
    }

    async #renderTransactions(container, transactions)
    {
        const transformedTransactions = transactions.map(t =>
        {
            let amount = t.amount < 0
                ? `\$ ${(-t.amount / 1000).toFixed(2)}`
                : `+\$ ${(t.amount / 1000).toFixed(2)}`;
            
            return {
                date: Temporal.PlainDate.from(t.date),
                account: t.account_name,
                payee: t.payee_name,
                category: t.category_name,
                description: t.memo,
                amount,
            };
        });

        const data = {
            title: this.#title,
            budgetId: this.#budgetId,
            transactions: transformedTransactions,
        };

        container.innerHTML = await this._template("template", data);
    }

    async #getUnapprovedTransactions(refreshData)
    {
        return await this._services.cache.get(
            "transactions",
            async() =>
            {
                const accessToken = YouNeedABudgetComponent.#getPersonalAccessToken(this.#accountName);

                await this.#importNewTransactions(accessToken);
                return await this.#fetchUnapprovedTransactions(accessToken);
            },
            refreshData);
    }

    async #fetchUnapprovedTransactions(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");

        const response = await fetch(
            `https://api.youneedabudget.com/v1/budgets/${this.#budgetId}/transactions` +
                `?type=unapproved`,
            {
                headers: { "Authorization": `Bearer ${accessToken}` },
            });
        if (!response.ok)
        {
            throw new Error(`Error while fetching transactions: ${response.status} ${response.statusText}`);
        }
    
        const payload = await response.json();

        return payload.data.transactions;
    }

    async #importNewTransactions(accessToken)
    {
        Argument.notNullOrUndefinedOrEmpty(accessToken, "accessToken");
        
        const response = await fetch(
            `https://api.youneedabudget.com/v1/budgets/${this.#budgetId}/transactions/import`,
            {
                method: 'POST',
                headers: { "Authorization": `Bearer ${accessToken}` },
            });
        if (!response.ok)
        {
            throw new Error(`Error while importing new transactions: ${response.status} ${response.statusText}`);
        }
    }

    async 

    static #getPersonalAccessToken(accountName)
    {
        Argument.notNullOrUndefinedOrEmpty(accountName, "accountName");
        
        const key = `you-need-a-budget.accounts.${accountName}`;

        let token = localStorage.getItem(key);
        if (!token)
        {
            token = prompt(`Please enter personal access token for You Need a Budget account ${accountName}`);
            if (!token)
            {
                throw new Error("A personal access token was not provided by user.");
            }

            localStorage.setItem(key, token);
        }

        return token;
    }
}