import { Component } from '@angular/core';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';

@Component({
    selector: 'app-admin-badge',
    standalone: true,
    templateUrl: './admin-badge.component.html',
    styleUrls: ['./admin-badge.component.scss'],
})
export class AdminBadgeComponent {
    constructor(private readonly adminModeService: AdminModeService) {}

    get isAdminModeActivated(): boolean {
        return this.adminModeService.isAdminModeActivated();
    }
}
