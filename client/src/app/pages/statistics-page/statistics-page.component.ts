import { CommonModule } from '@angular/common';
import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { GameLogComponent } from '@app/components/features/game-log/game-log.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/enums/routes.enum';
import { GlobalStatistics, SortColumn, SortDirection } from '@app/interfaces/game-statistics.interface';
import { SessionService } from '@app/services/session/session.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';
import { GameLogService } from '@app/services/game-log/game-log.service';

type TabType = 'chat' | 'journal';

@Component({
    selector: 'app-statistics-page',
    standalone: true,
    imports: [CommonModule, UiPageLayoutComponent, ChatComponent, GameLogComponent],
    templateUrl: './statistics-page.component.html',
    styleUrl: './statistics-page.component.scss',
})
export class StatisticsPageComponent implements OnInit {
    sortColumn: SortColumn = 'name';
    sortDirection: SortDirection = 'asc';
    activeTab: TabType = 'journal';

    readonly gameStatistics = computed(() => this.statisticsService.gameStatistics());
    readonly playersStatistics = computed(() => this.gameStatistics()?.playersStatistics || []);
    readonly globalStatistics = computed(() => this.gameStatistics()?.globalStatistics || this.getDefaultGlobalStatistics());

    constructor(
        private readonly router: Router,
        private readonly statisticsService: StatisticsService,
        private readonly sessionService: SessionService,
        readonly gameLogService: GameLogService,
    ) {}

    ngOnInit(): void {
        const sessionId = this.sessionService.id();
        if (sessionId) {
            this.statisticsService.loadGameStatistics(sessionId);
        } else {
            void this.router.navigate([ROUTES.HomePage]);
        }
    }

    onBackClick(): void {
        void this.router.navigate([ROUTES.HomePage]);
    }

    setActiveTab(tab: TabType): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: TabType): boolean {
        return this.activeTab === tab;
    }

    sortBy(column: SortColumn): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const currentStats = this.playersStatistics();
        const sortedStats = [...currentStats].sort((playerA, playerB) => {
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

        // Update the statistics with sorted data
        const currentGameStats = this.gameStatistics();
        if (currentGameStats) {
            this.statisticsService.setGameStatistics({
                ...currentGameStats,
                playersStatistics: sortedStats,
            });
        }
    }

    getSortIcon(column: SortColumn): string {
        if (this.sortColumn !== column) return '';
        return this.sortDirection === 'asc' ? 'asc' : 'desc';
    }

    isSortActive(column: SortColumn): boolean {
        return this.sortColumn === column;
    }

    private getDefaultGlobalStatistics(): GlobalStatistics {
        return {
            gameDuration: '0:00',
            totalTurns: 0,
            tilesVisitedPercentage: 0,
            totalTeleportations: 0,
            doorsManipulatedPercentage: 0,
            sanctuariesUsedPercentage: 0,
            flagHoldersCount: 0,
        };
    }
}
