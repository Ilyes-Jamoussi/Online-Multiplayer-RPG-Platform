import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Signal, ViewChild } from '@angular/core';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';
import { FaIcons } from '@app/enums/fa-icons.enum';
import { GameLogService } from '@app/services/game-log/game-log.service';

@Component({
    selector: 'app-game-log',
    standalone: true,
    imports: [CommonModule, UiIconComponent],
    templateUrl: './game-log.component.html',
    styleUrls: ['./game-log.component.scss'],
})
export class GameLogComponent implements AfterViewChecked {
    @ViewChild('entriesContainer') private readonly entriesContainer!: ElementRef;

    private previousEntriesLength = 0;

    readonly entries = this.gameLogService.getFilteredEntries();

    constructor(private readonly gameLogService: GameLogService) {}

    ngAfterViewChecked(): void {
        const currentLength = this.entries().length;
        if (currentLength !== this.previousEntriesLength) {
            this.previousEntriesLength = currentLength;
            this.scrollToBottom();
        }
    }

    get filterByMeValue(): Signal<boolean> {
        return this.gameLogService.filterByMe;
    }

    formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
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
