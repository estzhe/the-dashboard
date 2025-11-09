export default interface Transaction
{
    id: string,
    date: string,
    amount: number,
    memo: string,
    cleared: string,
    approved: boolean,
    account_id: string,
    payee_id: string,
    category_id: string,
    account_name: string,
    payee_name: string,
    category_name: string,
}