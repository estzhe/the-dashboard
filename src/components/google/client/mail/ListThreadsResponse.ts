import Thread from "app/components/google/client/mail/Thread.js";

/**
 * @see https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.threads/list#response-body
 */
export default interface ListThreadsResponse
{
    threads: Thread[],
    nextPageToken?: string,
    resultSizeEstimate: number,
}