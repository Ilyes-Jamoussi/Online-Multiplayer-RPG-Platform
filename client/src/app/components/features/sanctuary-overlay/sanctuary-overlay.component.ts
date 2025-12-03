import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SANCTUARY_SUCCESS_RATE } from '@app/constants/combat.constants';
import { PlaceableLabel } from '@app/enums/placeable-label.enum';
import { SanctuaryDescription, SanctuaryDoubleDescription } from '@app/enums/sanctuary-description.enum';
import { AssetsService } from '@app/services/assets/assets.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

@Component({
    selector: 'app-sanctuary-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sanctuary-overlay.component.html',
    styleUrls: ['./sanctuary-overlay.component.scss'],
})
export class SanctuaryOverlayComponent {
    readonly sanctuarySuccessRate = SANCTUARY_SUCCESS_RATE;

    constructor(
        private readonly inGameService: InGameService,
        private readonly assetsService: AssetsService,
    ) {}

    get openedSanctuary() {
        return this.inGameService.openedSanctuary();
    }

    get sanctuaryImage(): string {
        if (!this.openedSanctuary) return '';
        return this.assetsService.getPlaceableImage(this.openedSanctuary.kind);
    }

    get sanctuaryName(): string {
        if (!this.openedSanctuary) return '';
        return PlaceableLabel[this.openedSanctuary.kind];
    }

    get sanctuaryDescription(): string {
        if (!this.openedSanctuary) return '';
        const description = this.isHeal ? SanctuaryDescription.HEAL : SanctuaryDescription.FIGHT;
        return description || '';
    }

    get sanctuaryDoubleDescription(): string {
        if (!this.openedSanctuary) return '';
        const description = this.isHeal ? SanctuaryDoubleDescription.HEAL : SanctuaryDoubleDescription.FIGHT;
        return description || '';
    }

    get isHeal(): boolean {
        return this.openedSanctuary?.kind === PlaceableKind.HEAL;
    }

    get isFight(): boolean {
        return this.openedSanctuary?.kind === PlaceableKind.FIGHT;
    }

    get hasResult(): boolean {
        return this.openedSanctuary?.success === true;
    }

    get showActions(): boolean {
        return this.openedSanctuary?.success === false;
    }

    get resultMessage(): string {
        if (!this.openedSanctuary || !this.hasResult) return '';
        if (this.isHeal && this.openedSanctuary.addedHealth) {
            return `+${this.openedSanctuary.addedHealth} points de vie`;
        }
        if (this.isFight) {
            const parts: string[] = [];
            if (this.openedSanctuary.addedAttack) {
                parts.push(`+${this.openedSanctuary.addedAttack} attaque`);
            }
            if (this.openedSanctuary.addedDefense) {
                parts.push(`+${this.openedSanctuary.addedDefense} défense`);
            }
            return parts.join(' et ');
        }
        return '';
    }

    performAction(double: boolean): void {
        if (!this.openedSanctuary) return;
        this.inGameService.performSanctuaryAction(this.openedSanctuary.x, this.openedSanctuary.y, this.openedSanctuary.kind, double);
    }

    close(): void {
        this.inGameService.closeSanctuary();
    }
}
