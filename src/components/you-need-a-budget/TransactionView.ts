import {Temporal} from "@js-temporal/polyfill";

export default interface TransactionView
{
    date: Temporal.PlainDate,
    account: string,
    payee: string,
    category: string,
    description: string,
    amount: string,
}