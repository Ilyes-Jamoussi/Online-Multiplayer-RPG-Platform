import { AvailableAction } from '@common/interfaces/available-action.interface';

export interface EvaluatedAction {
    action: AvailableAction;
    priority: number;
    distance: number;
}
