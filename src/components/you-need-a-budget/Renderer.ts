import { Temporal } from '@js-temporal/polyfill';
import Transaction from "app/components/you-need-a-budget/client/Transaction.js";
import TransactionView from "app/components/you-need-a-budget/TransactionView.js";
import BaseComponentRenderer from "app/components/BaseComponentRenderer.js";
import Engine from "app/components/you-need-a-budget/Engine.js";
import template from 'app/components/you-need-a-budget/template.hbs';

export default class Renderer extends BaseComponentRenderer<Engine>
{
    public override async render(refreshData: boolean)
    {
        await super.render(refreshData);

        const transactions = await this.engine.getUnapprovedTransactions(refreshData);
        const transactionViews = transactions.map(t => this.toTransactionView(t));

        const data = {
            title: this.engine.title,
            budgetId: this.engine.budgetId,
            transactions: transactionViews,
        };
        this.container.innerHTML = template(data);
    }

    private toTransactionView(transaction: Transaction): TransactionView
    {
        let amount = transaction.amount < 0
            ? `\$ ${(-transaction.amount / 1000).toFixed(2)}`
            : `+\$ ${(transaction.amount / 1000).toFixed(2)}`;

        return {
            date: Temporal.PlainDate.from(transaction.date),
            account: transaction.account_name,
            payee: transaction.payee_name,
            category: transaction.category_name,
            description: transaction.memo,
            amount,
        };
    }
}