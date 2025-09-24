import { Injectable } from '@angular/core';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

@Injectable({
    providedIn: 'root',
})
export class GameParametersService {
    private _mapSize: MapSize = MapSize.MEDIUM;
    private _gameMode: GameMode = GameMode.CLASSIC;
    private _gameName: string = '';
    private _gameDescription: string = '';

    get mapSize(): MapSize {
        return this._mapSize;
    }

    get gameMode(): GameMode {
        return this._gameMode;
    }

    get gameName(): string {
        return this._gameName;
    }

    get gameDescription(): string {
        return this._gameDescription;
    }

    setMapSize(size: MapSize): void {
        this._mapSize = size;
    }

    setGameMode(mode: GameMode): void {
        this._gameMode = mode;
    }

    setGameName(name: string): void {
        this._gameName = name;
    }

    setGameDescription(description: string): void {
        this._gameDescription = description;
    }
}
