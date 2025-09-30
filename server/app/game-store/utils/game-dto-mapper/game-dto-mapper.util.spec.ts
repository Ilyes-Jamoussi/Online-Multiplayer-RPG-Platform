import { GameDocument } from '@app/game-store/entities/game.entity';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { TileKind } from '@common/enums/tile-kind.enum';
import { Types } from 'mongoose';
import { GameDtoMapper } from './game-dto-mapper.util';

describe('GameDtoMapper', () => {
    let mapper: GameDtoMapper;

    beforeEach(() => {
        mapper = new GameDtoMapper();
    });

    const mockGameDocument: Partial<GameDocument> = {
        id: { toString: () => '507f1f77bcf86cd799439011' },
        _id: { toString: () => '507f1f77bcf86cd799439011' } as Types.ObjectId,
        name: 'Test Game',
        description: 'Test Description',
        size: MapSize.MEDIUM,
        mode: GameMode.CLASSIC,
        tiles: [
            { x: 0, y: 0, kind: TileKind.BASE },
            { x: 1, y: 0, kind: TileKind.WALL },
        ],
        objects: [
            { x: 0, y: 1, kind: PlaceableKind.START, placed: true, _id: new Types.ObjectId('507f1f77bcf86cd799439012') },
            { x: 1, y: 1, kind: PlaceableKind.FLAG, placed: false, _id: new Types.ObjectId('507f1f77bcf86cd799439013') },
        ],
        gridPreviewUrl: '/assets/grid-previews/game-123-preview.png',
        lastModified: new Date('2024-01-15T10:30:00Z'),
        createdAt: new Date('2024-01-10T09:00:00Z'),
        visibility: true,
        draft: false,
    };

    it('should map to GameEditorDto', () => {
        const dto = mapper.toGameEditorDto(mockGameDocument as GameDocument);
        expect(dto).toEqual({
            id: '507f1f77bcf86cd799439011',
            name: 'Test Game',
            description: 'Test Description',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            tiles: [
                { x: 0, y: 0, kind: 'BASE' },
                { x: 1, y: 0, kind: 'WALL' },
            ],
            objects: [
                { x: 0, y: 1, kind: 'START', placed: true, id: '507f1f77bcf86cd799439012' },
                { x: 1, y: 1, kind: 'FLAG', placed: false, id: '507f1f77bcf86cd799439013' },
            ],
            gridPreviewUrl: '/assets/grid-previews/game-123-preview.png',
            lastModified: new Date('2024-01-15T10:30:00Z'),
        });
    });

    it('should map to GamePreviewDto', () => {
        const dto = mapper.toGamePreviewDto(mockGameDocument as GameDocument);
        expect(dto).toEqual({
            id: '507f1f77bcf86cd799439011',
            name: 'Test Game',
            size: MapSize.MEDIUM,
            mode: GameMode.CLASSIC,
            description: 'Test Description',
            lastModified: new Date('2024-01-15T10:30:00Z'),
            visibility: true,
            gridPreviewUrl: '/assets/grid-previews/game-123-preview.png',
            draft: false,
        });
    });

    it('should handle missing description', () => {
        const doc = { ...mockGameDocument, description: undefined };
        const dto = mapper.toGamePreviewDto(doc as GameDocument);
        expect(dto.description).toBe('');
    });

    it('should return empty string for default draft game name', () => {
        const doc = { ...mockGameDocument, name: 'Nom...' };
        const dto = mapper.toGameEditorDto(doc as GameDocument);
        expect(dto.name).toBe('');
    });

    it('should return empty string for default draft game description', () => {
        const doc = { ...mockGameDocument, description: 'Description du jeu...' };
        const dto = mapper.toGameEditorDto(doc as GameDocument);
        expect(dto.description).toBe('');
    });
});
