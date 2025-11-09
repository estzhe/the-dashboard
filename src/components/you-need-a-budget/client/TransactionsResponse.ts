import Transaction from "app/components/you-need-a-budget/client/Transaction.js";

export default interface TransactionsResponse
{
    data: {
        transactions: Transaction[],
        server_knowledge: number,
    },
}