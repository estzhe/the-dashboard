export default interface Task
{
    gid: string;
    name: string;
    notes: string|undefined;
    due_on: string|undefined;
}