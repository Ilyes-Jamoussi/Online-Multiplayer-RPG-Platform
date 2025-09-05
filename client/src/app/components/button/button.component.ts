import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() text: string = 'Bouton';
  @Input() type: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon: string = '';
  @Input() fullWidth: boolean = false;

  @Output() buttonClick = new EventEmitter<void>();
  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }

  get buttonClasses(): string {
    const classes = [
      'custom-button',
      `button-${this.type}`,
      `button-${this.size}`
    ];

    if (this.disabled) classes.push('button-disabled');
    if (this.loading) classes.push('button-loading');
    if (this.fullWidth) classes.push('button-full-width');

    return classes.join(' ');
  }
}

