import MessagePart from "app/components/google/client/mail/MessagePart.js";

/**
 * @see https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages#Message
 */
export default interface Message
{
    id: string,
    threadId: string,
    labelIds?: string[],
    snippet: string,
    historyId: string,
    internalDate: string,
    payload: MessagePart,
    sizeEstimate: number,
}
