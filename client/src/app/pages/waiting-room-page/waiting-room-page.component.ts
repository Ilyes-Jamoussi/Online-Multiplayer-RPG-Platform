import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { UiButtonComponent } from '@app/shared/ui/components/button/button.component';
import { UiPageLayoutComponent } from '@app/shared/ui/components/page-layout/page-layout.component';

@Component({
    selector: 'app-waiting-room-page',
    templateUrl: './waiting-room-page.component.html',
    styleUrls: ['./waiting-room-page.component.scss'],
    imports: [UiPageLayoutComponent, UiButtonComponent],
})
export class WaitingRoomPageComponent {
    constructor(private readonly router: Router) {}

    onBackToGameSelection(): void {
        this.router.navigate([ROUTES.gameSessionCreation]);
    }
}
