import Header from "app/components/google/client/mail/Header.js";
import MessagePartBody from "app/components/google/client/mail/MessagePartBody.js";

/**
 * A single MIME message part.
 *
 * @see https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages#Message.MessagePart
 */
export default interface MessagePart
{
    /**
     * The immutable ID of the message part.
     */
    partId: string,
    /**
     * The MIME type of the message part.
     */
    mimeType: string,
    /**
     * The filename of the attachment. Only present if this message part represents an attachment.

     */
    filename?: string;
    /**
     * List of headers on this message part. For the top-level message part, representing the entire message
     * payload, it will contain the standard RFC 2822 email headers such as `To`, `From`, and `Subject`.
     */
    headers: Header[],
    /**
     * The message part body for this part, which may be empty for container MIME message parts.
     */
    body?: MessagePartBody,
    /**
     * The child MIME message parts of this part. This only applies to container MIME message parts, for example
     * `multipart/*`. For non- container MIME message part types, such as text/plain, this field is empty.
     */
    parts?: MessagePart[],
}