import { Injectable, Signal, signal } from '@angular/core';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { CreateGameDto } from '@common/dto/game-store/create-game.dto';
import { ItemType } from '@common/enums/item-type.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { TileType } from '@common/enums/tile-type.enum';
import { ItemContainer } from '@common/interfaces/item-container.interface';
import { Tile } from '@common/interfaces/tile.interface';

@Injectable({
    providedIn: 'root',
})
export class GameEditorService {
    private readonly _grid = signal<Tile[][]>([]);
    private readonly _itemContainers = signal<ItemContainer[]>([]);
    private readonly _validationErrors = signal<string[]>([]);

    private _mapSize: MapSize = MapSize.Medium;
    private _activeTileType: TileType = TileType.Sand;
    private _activeItem: ItemType | null = null;
    private _name: string = '';
    private _description: string = '';
    private _capturedImage: string = '';

    constructor(private readonly mapService: GameMapService) {}

    get grid(): Signal<Tile[][]> {
        return this._grid.asReadonly();
    }

    get itemContainers(): Signal<ItemContainer[]> {
        return this._itemContainers.asReadonly();
    }

    get validationErrors(): Signal<string[]> {
        return this._validationErrors.asReadonly();
    }

    get mapSize(): MapSize {
        return this._mapSize;
    }

    get activeTileType(): TileType {
        return this._activeTileType;
    }

    get activeItem(): ItemType | null {
        return this._activeItem;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get capturedImage(): string {
        return this._capturedImage;
    }

    getTile(x: number, y: number): Tile {
        return this._grid()[y][x];
    }

    setMapSize(size: MapSize): void {
        this._mapSize = size;
        this._grid.set(this.mapService.buildBaseGrid(size));
        this._itemContainers.set(this.mapService.buildItemsContainer(size));
    }

    getCreateGameDto(): CreateGameDto {
        return {
            size: this._mapSize,
            name: this._name,
            description: this._description,
            map: this._grid(),
            items: this._itemContainers(),
            mapPreviewImage: this._capturedImage,
        };
    }

    setActiveTileType(type: TileType): void {
        this._activeTileType = type;
    }

    setActiveItem(item: ItemType | null): void {
        this._activeItem = item;
    }

    setCapturedImage(image: string): void {
        this._capturedImage = image;
    }

    setName(name: string): void {
        this._name = name;
    }

    setDescription(description: string): void {
        this._description = description;
    }

    resetGrid(): void {
        this._grid.set(this.mapService.buildBaseGrid(this._mapSize));
        this._itemContainers.set(this.mapService.buildItemsContainer(this._mapSize));
    }

    resetTileToSand(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if (tile.item) {
            this.incrementItemCounter(tile.item);
        }
        const updatedTile = this.mapService.buildTileFromType(TileType.Sand, tile);
        this.setGridTileAt(x, y, updatedTile);
    }

    saveGame(): CreateGameDto | null {
        if (!this.canSaveGame()) {
            return null;
        }
        return this.getCreateGameDto();
    }

    canSaveGame(): boolean {
        const errors: string[] = [];

        if (!this._name.trim()) {
            errors.push('Le nom du jeu ne doit pas être vide.');
        }

        if (!this._description.trim()) {
            errors.push('La description du jeu ne doit pas être vide.');
        }

        this._validationErrors.set(errors);
        return errors.length === 0;
    }

    validateName(): boolean {
        return this._name.trim().length > 0;
    }

    validateDescription(): boolean {
        return this._description.trim().length > 0;
    }

    placeActiveTileTypeAt(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if (this._activeTileType === TileType.Door || tile.type !== this._activeTileType) {
            if (tile.item) {
                this.incrementItemCounter(tile.item);
            }
            const updatedTile = this.mapService.buildTileFromType(this._activeTileType, tile);
            this.setGridTileAt(x, y, updatedTile);
        }
    }

    placeActiveItemAt(x: number, y: number): void {
        const tile = this.getTile(x, y);

        if (!this.canPlaceActiveItemOnTile(tile)) {
            return;
        }

        const updatedTile = { ...tile, item: this._activeItem };
        this.setGridTileAt(x, y, updatedTile);
        this.decrementItemCounter(this._activeItem);

        this.setActiveItem(null);
    }

    removeItemAt(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if (tile.item) {
            this.incrementItemCounter(tile.item);
        }
        this.setGridTileAt(x, y, { ...tile, item: null });
    }

    moveItem(fromX: number, fromY: number, toX: number, toY: number): void {
        const fromTile = this.getTile(fromX, fromY);
        const toTile = this.getTile(toX, toY);

        if (!fromTile.item || !this.canPlaceItemOnTile(toTile)) {
            return;
        }

        this.setGridTileAt(fromX, fromY, { ...fromTile, item: null });

        this.setGridTileAt(toX, toY, { ...toTile, item: fromTile.item });
    }

    returnItemToContainer(x: number, y: number, item: ItemType): void {
        const tile = this.getTile(x, y);
        if (tile.item) {
            this.incrementItemCounter(item);
            this.setGridTileAt(x, y, { ...tile, item: null });
        }
    }

    private setGridTileAt(x: number, y: number, tile: Tile): void {
        const grid = this._grid();
        grid[y][x] = tile;
        this._grid.set([...grid]);
    }

    private decrementItemCounter(item: ItemType | null): void {
        this._itemContainers.update((containers) =>
            containers.map((container) => (container.item === item ? { ...container, count: container.count - 1 } : container)),
        );
    }

    private incrementItemCounter(item: ItemType | null): void {
        this._itemContainers.update((containers) =>
            containers.map((container) => (container.item === item ? { ...container, count: container.count + 1 } : container)),
        );
    }

    private canPlaceActiveItemOnTile(tile: Tile): boolean {
        return tile.type !== TileType.Wall && tile.type !== TileType.Door && !tile.item && this._activeItem !== null && this.getActiveItemCount() > 0;
    }

    private getActiveItemCount(): number {
        return this._itemContainers().find((container) => container.item === this._activeItem)?.count ?? 0;
    }

    private canPlaceItemOnTile(tile: Tile): boolean {
        return tile.type !== TileType.Wall && tile.type !== TileType.Door && !tile.item;
    }
}
