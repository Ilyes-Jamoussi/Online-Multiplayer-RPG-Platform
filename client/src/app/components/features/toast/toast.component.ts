import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '@app/services/toast/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
    constructor(private readonly toastService: ToastService) {}

    get toasts() {
        return this.toastService.toasts();
    }

    removeToast(id: string): void {
        this.toastService.remove(id);
    }
}

