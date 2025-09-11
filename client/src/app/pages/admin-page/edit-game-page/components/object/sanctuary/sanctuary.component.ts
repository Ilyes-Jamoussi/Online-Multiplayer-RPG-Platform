import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-object-sanctuary',
    templateUrl: './sanctuary.component.html',
    styleUrls: ['./sanctuary.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class SanctuaryComponent {
    @Input() cellSize: number = 0; // Taille d'une case en pixels
}
