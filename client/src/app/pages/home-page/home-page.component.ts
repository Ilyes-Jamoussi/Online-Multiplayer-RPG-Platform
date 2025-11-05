import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { CombatService } from '@app/services/combat/combat.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { PlayerService } from '@app/services/player/player.service';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    imports: [FormsModule, UiButtonComponent, UiPageLayoutComponent],
    standalone: true,
})
export class HomePageComponent implements OnInit {
    teamInfo = {
        teamNumber: '204',
        members: ['Wael El Karoui', 'Ilyes Jamoussi', 'Noah Blanchard', 'Adam Rafai', 'Eduard Andrei Podaru'],
    };

    constructor(
        private readonly router: Router,
        private readonly playerService: PlayerService,
        private readonly inGameService: InGameService,
        private readonly combatService: CombatService,
        private readonly adminModeService: AdminModeService,
    ) {}

    ngOnInit(): void {
        this.playerService.reset();
        this.inGameService.reset();
        this.combatService.reset();
        this.adminModeService.reset();
    }

    navigateToCreateGame(): void {
        void this.router.navigate([ROUTES.SessionCreationPage]);
    }

    navigateToAdminPage(): void {
        void this.router.navigate([ROUTES.ManagementPage]);
    }

    navigateToJoinGame(): void {
        void this.router.navigate([ROUTES.JoinSessionPage]);
    }
}
