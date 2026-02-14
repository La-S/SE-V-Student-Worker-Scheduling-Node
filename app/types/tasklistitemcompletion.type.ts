export interface TaskListItemCompletionType {
    id?: number,
    shiftId: number,
    taskListItemId: number,
    checkedOffUser: number,
    checkedOff: boolean,
    time: string
}