import { AvailableActionType } from '@common/enums/available-action-type.enum';

export interface AvailableAction {
    type: AvailableActionType;
    x: number;
    y: number;
}
