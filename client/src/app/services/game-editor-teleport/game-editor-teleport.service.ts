import { computed, Injectable } from '@angular/core';
import { TeleportChannelDto } from '@app/dto/teleport-channel-dto';
import { GameEditorStoreService } from '@app/services/game-editor-store/game-editor-store.service';
import { TileKind } from '@common/enums/tile.enum';

@Injectable()
export class GameEditorTeleportService {
    constructor(private readonly gameEditorStoreService: GameEditorStoreService) {}

    readonly availableTeleportChannels = computed<TeleportChannelDto[]>(() => {
        return this.gameEditorStoreService.teleportChannels.filter((channel) => !channel.tiles?.entryA || !channel.tiles?.entryB);
    });

    get teleportChannels(): readonly TeleportChannelDto[] {
        return this.gameEditorStoreService.teleportChannels;
    }

    getAvailableTeleportChannels(): TeleportChannelDto[] {
        return this.availableTeleportChannels();
    }

    getNextAvailableTeleportChannel(): TeleportChannelDto | undefined {
        const available = this.availableTeleportChannels();
        if (available.length === 0) return undefined;
        return available.sort((left, right) => left.channelNumber - right.channelNumber)[0];
    }

    isTeleportDisabled(): boolean {
        return this.availableTeleportChannels().length === 0;
    }

    placeTeleportTile(x: number, y: number, channelNumber: number, isFirstTile: boolean): void {
        this.gameEditorStoreService.teleportChannelsSignal.update((channels) => {
            const draft = [...channels];
            const channel = draft.find((c) => c.channelNumber === channelNumber);
            if (!channel) return channels;

            if (isFirstTile) {
                if (!channel.tiles) {
                    channel.tiles = { entryA: { x, y }, entryB: undefined };
                } else {
                    channel.tiles.entryA = { x, y };
                }
            } else {
                if (channel.tiles) {
                    channel.tiles.entryB = { x, y };
                }
            }
            return draft;
        });
    }

    cancelTeleportPlacement(channelNumber: number): void {
        this.gameEditorStoreService.teleportChannelsSignal.update((teleportChannels) => {
            const draft = [...teleportChannels];
            const channel = draft.find((c) => c.channelNumber === channelNumber);
            if (!channel || !channel.tiles) return teleportChannels;

            channel.tiles = { entryA: undefined, entryB: undefined };

            return draft;
        });
    }

    removeTeleportPair(x: number, y: number): void {
        const tile = this.gameEditorStoreService.getTileAt(x, y);
        if (!tile || tile.kind !== TileKind.TELEPORT || !tile.teleportChannel) return;

        const channelNumber = tile.teleportChannel;
        this.gameEditorStoreService.teleportChannelsSignal.update((channels) => {
            const draft = [...channels];
            const channel = draft.find((teleportChannel) => teleportChannel.channelNumber === channelNumber);
            if (!channel || !channel.tiles) return channels;
            channel.tiles = { entryA: undefined, entryB: undefined };
            return draft;
        });
    }
}
