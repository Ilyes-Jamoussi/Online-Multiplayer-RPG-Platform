import { Directive, Input } from '@angular/core';
import {
    UiAlignment,
    UiColor,
    UiElevation,
    UiFontSize,
    UiFontWeight,
    UiShape,
    UiShapeVariant,
    UiSize,
    UiSpacing,
    UiStyle,
    UiTextTransform,
    UiVariant,
    UiWidth,
} from '@app/types/ui.types';

@Directive()
export abstract class UiBaseComponent {
    @Input() variant?: UiVariant;
    @Input() shape?: UiShapeVariant;
    @Input() fullWidth?: boolean;

    @Input() color?: UiColor;
    @Input() style?: UiStyle;
    @Input() width?: UiWidth;

    @Input() size: UiSize = 'md';
    @Input() disabled = false;
    @Input() loading = false;
    @Input() alignContent: UiAlignment = 'center';
    @Input() gap: UiSpacing = 'md';
    @Input() elevation: UiElevation = 'none';
    @Input() popOut = true;
    @Input() disableHoverEffects = false;
    @Input() fontWeight: UiFontWeight = 'normal';
    @Input() textTransform: UiTextTransform = 'none';
    @Input() fontSize?: UiFontSize;

    get computedColor(): UiColor {
        if (this.color) return this.color;
        const variantMap: Record<UiVariant, UiColor> = {
            primary: 'primary',
            secondary: 'secondary',
            success: 'primary',
            danger: 'danger',
            warning: 'warn',
            info: 'info',
        };
        return variantMap[this.variant || 'primary'] || 'primary';
    }

    get computedStyle(): UiStyle {
        return this.style || 'filled';
    }

    get computedShape(): UiShape {
        if (this.shape) return this.shape as UiShape;
        return 'rounded';
    }

    get computedWidth(): UiWidth {
        if (this.width) return this.width;
        return this.fullWidth ? 'full' : 'custom';
    }

    get classes(): Record<string, boolean> {
        return {
            [`c-${this.computedColor}`]: true,
            [`st-${this.computedStyle}`]: true,
            [`s-${this.size || 'md'}`]: true,
            [`sh-${this.computedShape}`]: true,
            [`al-${this.alignContent || 'center'}`]: true,
            [`gap-${this.gap || 'md'}`]: true,
            [`w-${this.computedWidth}`]: true,
            [`elev-${this.elevation || 'none'}`]: true,
            [`fw-${this.fontWeight}`]: Boolean(this.fontWeight),
            [`text-${this.textTransform}`]: Boolean(this.textTransform),
            [`fs-${this.fontSize}`]: Boolean(this.fontSize),
            [`v-${this.variant}`]: !!this.variant,
            isFull: !!this.fullWidth,
            isDisabled: this.disabled,
            isLoading: this.loading,
            popOut: this.popOut,
            disableHoverEffects: this.disableHoverEffects,
        };
    }
}
