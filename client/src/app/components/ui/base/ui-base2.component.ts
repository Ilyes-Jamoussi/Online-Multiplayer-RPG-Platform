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
} from '@app/types/ui2.types';


@Directive()
export abstract class UiBase2Component {
    @Input() color: UiColor = 'primary';

    @Input() style: UiStyle = 'filled';

    @Input() size: UiSize = 'md';

    @Input() shape: UiShape = 'rounded';

    @Input() alignContent: UiAlignment = 'center';

    @Input() gap: UiSpacing = 'md';

    @Input() width: UiWidth = 'custom';

    @Input() widthValue?: string;

    @Input() elevation: UiElevation = 'none';

    @Input() disabled = false;
    @Input() loading = false;

    @Input() popOut = true;
    @Input() disableHoverEffects = false;

    @Input() fontWeight: UiFontWeight = 'normal';

    @Input() textTransform: UiTextTransform = 'none';

    @Input() fontSize?: UiFontSize = undefined;

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

    get styleVars(): Record<string, string> {
        const vars: Record<string, string> = {};
        if (this.width === 'custom' && this.widthValue) vars['--ui-w'] = this.widthValue;
        return vars;
    }
}
