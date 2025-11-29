import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { VictoryData } from '@app/interfaces/victory-data.interface';

@Component({
    selector: 'app-combat-result',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-result.component.html',
    styleUrl: './combat-result.component.scss',
})
export class CombatResultComponent {
    readonly victoryData = input.required<VictoryData>();
    readonly isVictory = input.required<boolean>();
    readonly victoryMessage = input.required<string>();
    readonly victorySubtitle = input.required<string>();
}
