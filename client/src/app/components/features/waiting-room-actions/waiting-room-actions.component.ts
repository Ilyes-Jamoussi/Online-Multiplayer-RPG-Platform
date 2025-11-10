import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { VirtualPlayerModalComponent } from '@app/components/features/virtual-player-modal/virtual-player-modal.component';
import { PlayerService } from '@app/services/player/player.service';
import { SessionService } from '@app/services/session/session.service';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';

@Component({
    selector: 'app-waiting-room-actions',
    standalone: true,
    imports: [NgTemplateOutlet, VirtualPlayerModalComponent],
    templateUrl: './waiting-room-actions.component.html',
    styleUrls: ['./waiting-room-actions.component.scss'],
})
export class WaitingRoomActionsComponent {
    private readonly _showVirtualPlayerModal = signal(false);

    readonly showVirtualPlayerModal = this._showVirtualPlayerModal.asReadonly();
    readonly isAdmin = computed(() => this.playerService.isAdmin());
    readonly isLocked = computed(() => this.sessionService.isRoomLocked());
    readonly canToggleLock = computed(() => 
        this.sessionService.canBeLocked() || this.sessionService.canBeUnlocked()
    );
    readonly canStartGame = computed(() => this.sessionService.canStartGame());
    readonly canAddVirtualPlayer = computed(() => 
        this.sessionService.players().length < this.sessionService.maxPlayers()
    );

    constructor(
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
    ) {}

    toggleLock(): void {
        if (this.sessionService.canBeLocked()) {
            this.sessionService.lock();
        } else if (this.sessionService.canBeUnlocked()) {
            this.sessionService.unlock();
        }
    }

    startGame(): void {
        this.sessionService.startGameSession();
    }

    openVirtualPlayerModal(): void {
        this._showVirtualPlayerModal.set(true);
    }

    onVirtualPlayerTypeSelected(type: VirtualPlayerType): void {
        this.sessionService.addVirtualPlayer(type);
        this._showVirtualPlayerModal.set(false);
    }

    closeVirtualPlayerModal(): void {
        this._showVirtualPlayerModal.set(false);
    }
}
