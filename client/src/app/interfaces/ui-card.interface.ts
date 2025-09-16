import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing, UiElevation } from '@app/shared/ui/types/ui.types';

export interface UiCardContext {
    variant: UiVariant;
    size: UiSize;
    shape: UiShapeVariant;
    align: UiAlignment;
    gap: UiSpacing;
    elevation: UiElevation;
}
