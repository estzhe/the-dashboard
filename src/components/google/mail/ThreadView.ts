export default interface ThreadView
{
    threadId: string,
    from: {
        displayName?: string,
        email: string,
    },
    subject?: string,
    snippet: string,
    isUnread: boolean,
}