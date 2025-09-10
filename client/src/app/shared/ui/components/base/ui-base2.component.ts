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
 * Base abstraite pour les composants UI (pas de template).
 * Applique des classes BEM-like pilotant le SCSS du design system.
 */
@Directive()
export abstract class UiBase2Component {
    /** Couleur (rôle) */
    @Input() color: UiColor = 'primary';

    /** Style visuel (filled / outline / ghost / soft / link) */
    @Input() style: UiStyle = 'filled';

    /** Taille */
    @Input() size: UiSize = 'md';

    /** Forme */
    @Input() shape: UiShape = 'rounded';

    /** Alignement (si pertinent) */
    @Input() alignContent: UiAlignment = 'center';

    /** Espacement (si pertinent) */
    @Input() gap: UiSpacing = 'md';

    /** Largeur déclarative */
    @Input() width: UiWidth = 'custom';

    /** Valeur de largeur pour w-custom (ex: '24rem' | '320px' | '70%') */
    @Input() widthValue?: string;

    /** Élévation */
    @Input() elevation: UiElevation = 'none';

    /** États */
    @Input() disabled = false;
    @Input() loading = false;

    /** Interactions */
    @Input() popOut = true;
    @Input() disableHoverEffects = false;

    /** Poids de la police */
    @Input() fontWeight: UiFontWeight = 'normal';

    /** Transformations de texte */
    @Input() textTransform: UiTextTransform = 'none';

    /** Font size (optionel) */
    @Input() fontSize?: UiFontSize = undefined;

    /** Classes à binder dans [ngClass] */
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

    /** Variables CSS à binder dans [ngStyle] */
    get styleVars(): Record<string, string> {
        const vars: Record<string, string> = {};
        if (this.width === 'custom' && this.widthValue) vars['--ui-w'] = this.widthValue;
        return vars;
    }
}
