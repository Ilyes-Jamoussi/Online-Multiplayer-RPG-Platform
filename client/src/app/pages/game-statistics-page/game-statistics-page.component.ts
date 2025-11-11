import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GlobalStatistics, PlayerStatistics, SortColumn, SortDirection } from '@app/interfaces/game-statistics.interface';

@Component({
    selector: 'app-game-statistics-page',
    standalone: true,
    imports: [CommonModule, UiPageLayoutComponent, UiButtonComponent, ChatComponent],
    templateUrl: './game-statistics-page.component.html',
    styleUrl: './game-statistics-page.component.scss',
})
export class GameStatisticsPageComponent {
    sortColumn: SortColumn = 'name';
    sortDirection: SortDirection = 'asc';

    // Mock data - à remplacer par les vraies données
    playersStatistics: PlayerStatistics[] = [
        {
            name: 'Alice',
            combatCount: 8,
            combatWins: 5,
            combatLosses: 3,
            healthLost: 45,
            healthDealt: 78,
            tilesVisitedPercentage: 23.5,
        },
        {
            name: 'Bob',
            combatCount: 6,
            combatWins: 3,
            combatLosses: 3,
            healthLost: 32,
            healthDealt: 56,
            tilesVisitedPercentage: 18.2,
        },
        {
            name: 'Charlie',
            combatCount: 10,
            combatWins: 7,
            combatLosses: 3,
            healthLost: 28,
            healthDealt: 92,
            tilesVisitedPercentage: 31.8,
        },
        {
            name: 'Diana',
            combatCount: 4,
            combatWins: 1,
            combatLosses: 3,
            healthLost: 67,
            healthDealt: 34,
            tilesVisitedPercentage: 15.7,
        },
    ];

    globalStatistics: GlobalStatistics = {
        gameDuration: '45:32',
        totalTurns: 127,
        tilesVisitedPercentage: 67.3,
        totalTeleportations: 12,
        doorsManipulatedPercentage: 78.5,
        sanctuariesUsedPercentage: 45.2,
        flagHoldersCount: 3,
    };

    constructor(private readonly router: Router) {}

    onBackClick(): void {
        void this.router.navigate([ROUTES.HomePage]);
    }

    sortBy(column: SortColumn): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.playersStatistics.sort((playerA, playerB) => {
            const aValue = playerA[column];
            const bValue = playerB[column];
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = (aValue as number) - (bValue as number);
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    getSortIcon(column: SortColumn): string {
        if (this.sortColumn !== column) return '';
        return this.sortDirection === 'asc' ? 'asc' : 'desc';
    }

    isSortActive(column: SortColumn): boolean {
        return this.sortColumn === column;
    }
}
