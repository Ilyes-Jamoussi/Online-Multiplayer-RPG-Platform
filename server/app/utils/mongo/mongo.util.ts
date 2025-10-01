import { DTO_PROJECTIONS } from '@app/constants/mongo-projections.constants';
import { DtoType } from '@app/types/mongo-dto.types';

export function getProjection(type: DtoType): Record<string, 1> {
    return DTO_PROJECTIONS[type];
}
