import { Directive, Input } from '@angular/core';
import {
    UiColor,
    UiStyle,
    UiSize,
    UiShape,
    UiAlignment,
    UiSpacing,
    UiElevation,
    UiWidth,
    UiFontWeight,
    UiTextTransform,
    UiFontSize,
} from '@app/shared/ui/types/ui2.types';

/**
 * Abstract base for UI components (no template).
 * Applies BEM-like classes controlling the SCSS of the design system.
 */
@Directive()
export abstract class UiBase2Component {
    /** Color (role) */
    @Input() color: UiColor = 'primary';

    /** Visual style (filled / outline / ghost / soft / link) */
    @Input() style: UiStyle = 'filled';

    /** Size */
    @Input() size: UiSize = 'md';

    /** Shape */
    @Input() shape: UiShape = 'rounded';

    /** Alignment (if relevant) */
    @Input() alignContent: UiAlignment = 'center';

    /** Spacing (if relevant) */
    @Input() gap: UiSpacing = 'md';

    /** Declarative width */
    @Input() width: UiWidth = 'custom';

    /** Width value for w-custom (e.g. '24rem' | '320px' | '70%') */
    @Input() widthValue?: string;

    /** Elevation */
    @Input() elevation: UiElevation = 'none';

    /** States */
    @Input() disabled = false;
    @Input() loading = false;

    /** Interactions */
    @Input() popOut = true;
    @Input() disableHoverEffects = false;

    /** Font weight */
    @Input() fontWeight: UiFontWeight = 'normal';

    /** Text transformations */
    @Input() textTransform: UiTextTransform = 'none';

    /** Font size (optional) */
    @Input() fontSize?: UiFontSize = undefined;

    /** Classes to bind in [ngClass] */
    get classes(): Record<string, boolean> {
        return {
            [`c-${this.color}`]: true,
            [`st-${this.style}`]: true,
            [`s-${this.size}`]: true,
            [`sh-${this.shape}`]: true,
            [`al-${this.alignContent}`]: true,
            [`gap-${this.gap}`]: true,
            [`w-${this.width}`]: true,
            [`elev-${this.elevation}`]: true,
            [`fw-${this.fontWeight}`]: true,
            [`text-${this.textTransform}`]: true,
            [`fs-${this.fontSize}`]: !!this.fontSize,
            isDisabled: this.disabled,
            isLoading: this.loading,
            popOut: this.popOut,
            disableHoverEffects: this.disableHoverEffects,
        };
    }

    /** CSS variables to bind in [ngStyle] */
    get styleVars(): Record<string, string> {
        const vars: Record<string, string> = {};
        if (this.width === 'custom' && this.widthValue) vars['--ui-w'] = this.widthValue;
        return vars;
    }
}
