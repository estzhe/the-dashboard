export default interface ListResponse<TResult>
{
    results: TResult[];
    next_cursor: string | null;
}