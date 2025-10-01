import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';

@Component({
    selector: 'app-waiting-room-page',
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
    imports: [UiPageLayoutComponent, UiButtonComponent],
})
export class WaitingRoomPageComponent {
    constructor(private readonly router: Router) {}

    onBack(): void {
        this.router.navigate([ROUTES.home]);
    }
}
