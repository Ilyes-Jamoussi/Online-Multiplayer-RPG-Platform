import { Directive, Input } from '@angular/core';
import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing, UiElevation } from '@app/types/ui.types';

/**
 * Abstract base class for UI components (no template, not instantiable directly)
 */
@Directive()
export abstract class UiBaseComponent {
    @Input() variant: UiVariant = 'primary';

    @Input() size: UiSize = 'md';

    @Input() shape: UiShapeVariant = 'rounded';

    @Input() disabled: boolean = false;

    @Input() fullWidth: boolean = false;

    @Input() alignContent: UiAlignment = 'center';

    @Input() gap: UiSpacing = 'sm';

    @Input() loading: boolean = false;

    @Input() elevation: UiElevation = 'xs';

    @Input() popOut: boolean = true;

    
    get classes(): Record<string, boolean> {
        return {
            [`v-${this.variant || 'primary'}`]: true,
            [`s-${this.size || 'md'}`]: true,
            [`sh-${this.shape || 'rounded'}`]: true,
            isDisabled: this.disabled,
            isFull: this.fullWidth,
            [`al-${this.alignContent || 'center'}`]: true,
            [`gap-${this.gap || 'sm'}`]: true,
            [`elev-${this.elevation || 'xs'}`]: true,
            popOut: this.popOut,
            disableHoverEffects: false,
        };
    }
}
