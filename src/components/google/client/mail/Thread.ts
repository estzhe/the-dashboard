import Message from "app/components/google/client/mail/Message.js";

/**
 * @see https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.threads#Thread
 */
export default interface Thread
{
    id: string,
    snippet: string,
    historyId: string,
    messages?: Message[];
}