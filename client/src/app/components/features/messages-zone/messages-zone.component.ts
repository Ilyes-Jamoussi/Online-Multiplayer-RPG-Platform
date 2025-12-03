import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '@app/components/features/chat/chat.component';
import { GameLogComponent } from '@app/components/features/game-log/game-log.component';
import { GameLogService } from '@app/services/game-log/game-log.service';
import { TabType } from '@app/types/component.types';

@Component({
    selector: 'app-messages-zone',
    standalone: true,
    imports: [CommonModule, ChatComponent, GameLogComponent],
    templateUrl: './messages-zone.component.html',
    styleUrls: ['./messages-zone.component.scss'],
})
export class MessagesZoneComponent {
    activeTab: TabType = 'chat';

    constructor(private readonly gameLogService: GameLogService) {}

    setActiveTab(tab: TabType): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: TabType): boolean {
        return this.activeTab === tab;
    }

    isFilterByMe(): boolean {
        return this.gameLogService.filterByMe();
    }

    toggleFilter(): void {
        this.gameLogService.toggleFilter();
    }
}
