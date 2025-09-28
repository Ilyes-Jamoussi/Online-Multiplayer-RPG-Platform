import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-ui-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
})
export class UiHeaderComponent {
    @Input() title: string;
    @Input() subtitle?: string;
    @Input() showBackButton: boolean = false;

    @Output() backClick = new EventEmitter<void>();

    constructor(private readonly location: Location) {}

    onBack(): void {
        if (this.backClick.observed) {
            this.backClick.emit();
        } else {
            this.location.back();
        }
    }
}
