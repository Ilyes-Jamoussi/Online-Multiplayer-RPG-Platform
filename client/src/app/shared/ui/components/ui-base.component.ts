import { Directive, Input } from '@angular/core';
import { UiVariant, UiSize, UiShapeVariant, UiAlignment, UiSpacing } from '@app/shared/ui/types/ui.types';

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
    @Input() shape: UiShapeVariant = 'square';

    /** Disabled state */
    @Input() disabled: boolean = false;

    /** Full width */
    @Input() fullWidth: boolean = false;

    /** Alignment (optional, for components that use it) */
    @Input() align: UiAlignment = 'center';

    /** Gap (optional, for components that use it) */
    @Input() gap: UiSpacing = 'sm';

    /** Loading state */
    @Input() loading: boolean = false;

    /**
     * Returns the CSS classes for the component based on its inputs.
     * Extend this in child components if you need to add more classes.
     */
    get classes(): Record<string, boolean> {
        return {
            [`v-${this.variant}`]: true,
            [`s-${this.size}`]: true,
            [`sh-${this.shape}`]: true,
            isDisabled: this.disabled,
            isFull: this.fullWidth,
            [`al-${this.align}`]: true,
            [`gap-${this.gap}`]: true,
        };
    }
}
