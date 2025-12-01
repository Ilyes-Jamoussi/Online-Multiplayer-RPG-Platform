import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { VictoryData } from '@app/interfaces/victory-data.interface';

@Component({
    selector: 'app-combat-result',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-result.component.html',
    styleUrl: './combat-result.component.scss',
})
export class CombatResultComponent {
    @Input() victoryData!: VictoryData;
    @Input() isVictory!: boolean;
    @Input() victoryMessage!: string;
    @Input() victorySubtitle!: string;
}
