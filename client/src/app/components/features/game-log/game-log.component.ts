import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, computed, ElementRef, Signal, ViewChild } from '@angular/core';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';
import { FaIcons } from '@app/enums/fa-icons.enum';
import { GameLogService } from '@app/services/game-log/game-log.service';
import { GameLogEntry } from '@common/interfaces/game-log-entry.interface';

@Component({
    selector: 'app-game-log',
    standalone: true,
    imports: [CommonModule, UiIconComponent],
    templateUrl: './game-log.component.html',
    styleUrls: ['./game-log.component.scss'],
})
export class GameLogComponent implements AfterViewChecked {
    @ViewChild('entriesContainer') private readonly entriesContainer!: ElementRef;

    private shouldScrollToBottom = false;

    constructor(private readonly gameLogService: GameLogService) {}

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    get entries(): Signal<GameLogEntry[]> {
        const entries = computed(() => this.gameLogService.getFilteredEntries());
        this.shouldScrollToBottom = true;
        return entries;
    }

    get filterByMeValue(): Signal<boolean> {
        return this.gameLogService.filterByMe;
    }

    formatTime(timestamp: string): string {
        return new Date(timestamp).toLocaleTimeString('fr-CA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    toggleFilter(): void {
        this.gameLogService.toggleFilter();
    }

    getIconName(icon: string | undefined): keyof typeof FaIcons | undefined {
        if (!icon) {
            return undefined;
        }
        if (icon in FaIcons) {
            return icon as keyof typeof FaIcons;
        }
        return undefined;
    }

    private scrollToBottom(): void {
        if (this.entriesContainer) {
            const element = this.entriesContainer.nativeElement;
            element.scrollTop = element.scrollHeight;
        }
    }
}
