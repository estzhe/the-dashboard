/**
 * @see https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages.attachments#MessagePartBody
 */
export default interface MessagePartBody
{
    /**
     * When present, contains the ID of an external attachment that can be retrieved in a separate
     * `messages.attachments.get` request. When not present, the entire content of the message part
     * body is contained in the data field.
     */
    attachmentId?: string,
    /**
     * Number of bytes for the message part data (encoding notwithstanding).
     */
    size: number,
    /**
     * The body data of a MIME message part as a base64url encoded string. May be empty for MIME container types
     * that have no message body or when the body data is sent as a separate attachment. An attachment ID is
     * present if the body data is contained in a separate attachment.
     *
     * A base64-encoded string.
     */
    data: string,
}