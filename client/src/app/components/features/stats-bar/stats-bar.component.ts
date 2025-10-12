import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-stats-bar',
    imports: [CommonModule],
    templateUrl: './stats-bar.component.html',
    styleUrl: './stats-bar.component.scss',
})
export class StatsBarComponent {
    @Input() label: string = '';
    @Input() value: number = 0;
    @Input() maxValue: number = 10;
    @Input() color: string = '#4a90e2';
    @Input() showDice: boolean = false;
    @Input() dice: string = '';

    get segments(): boolean[] {
        return Array.from({ length: this.maxValue }, (_, i) => i < this.value);
    }
}
