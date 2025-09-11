import { Directive, Input } from '@angular/core';
import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing, UiElevation } from '@app/shared/ui/types/ui.types';

/**
 * Abstract base class for UI components (no template, not instantiable directly)
 */
@Directive()
export abstract class UiBaseComponent {
    /** Visual variant (color + style) */
    @Input() variant: UiVariant = 'primary';

    /** Size */
    @Input() size: UiSize = 'md';

    /** Shape */
    @Input() shape: UiShapeVariant = 'rounded';

    /** Disabled state */
    @Input() disabled: boolean = false;

    /** Full width */
    @Input() fullWidth: boolean = false;

    /** Alignment (optional, for components that use it) */
    @Input() alignContent: UiAlignment = 'center';

    /** Gap (optional, for components that use it) */
    @Input() gap: UiSpacing = 'sm';

    /** Loading state */
    @Input() loading: boolean = false;

    /** Elevation */
    @Input() elevation: UiElevation = 'xs';

    /** Activate pop out effect */
    @Input() popOut: boolean = true;

    /**
     * Returns the CSS classes for the component based on its inputs.
     * Extend this in child components if you need to add more classes.
     */
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
