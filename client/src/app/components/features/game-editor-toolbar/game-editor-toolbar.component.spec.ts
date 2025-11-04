import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveTool, ToolbarItem, ToolType } from '@app/interfaces/game-editor.interface';
import { GameEditorInteractionsService } from '@app/services/game-editor-interactions/game-editor-interactions.service';
import { TileKind } from '@common/enums/tile-kind.enum';
import { GameEditorToolbarComponent } from './game-editor-toolbar.component';

describe('GameEditorToolbarComponent', () => {
    let fixture: ComponentFixture<GameEditorToolbarComponent>;
    let component: GameEditorToolbarComponent;

    let interactionsSpy: jasmine.SpyObj<GameEditorInteractionsService>;
    let activeToolState: ActiveTool | null = null;

    const brushWall: ToolbarItem = { image: '/tiles/wall.png', tileKind: TileKind.WALL, class: 'wall' };
    const brushBase: ToolbarItem = { image: '/tiles/base.png', tileKind: TileKind.BASE, class: 'base' };
    const brushesList: ToolbarItem[] = [brushWall, brushBase];

    beforeEach(async () => {
        interactionsSpy = jasmine.createSpyObj<GameEditorInteractionsService>('GameEditorInteractionsService', ['getToolbarBrushes']);

        Object.defineProperty(interactionsSpy, 'activeTool', {
            get: (): ActiveTool | null => activeToolState,
            set: (activeTool: ActiveTool | null) => {
                activeToolState = activeTool;
            },
            configurable: true,
        });

        interactionsSpy.getToolbarBrushes.and.returnValue(brushesList);

        await TestBed.configureTestingModule({
            imports: [GameEditorToolbarComponent],
            providers: [{ provide: GameEditorInteractionsService, useValue: interactionsSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('brushes getter should proxy to interactions service', () => {
        const res = component.brushes;
        expect(interactionsSpy.getToolbarBrushes).toHaveBeenCalled();
        expect(res).toEqual(brushesList);
    });

    it('selectTileBrush should set activeTool to TileBrushTool with given kind', () => {
        component.selectTileBrush(TileKind.WATER);
        expect(activeToolState).toEqual({
            type: ToolType.TileBrushTool,
            tileKind: TileKind.WATER,
            leftDrag: false,
            rightDrag: false,
        });
    });

    it('isBrushSelected returns false when no active tool', () => {
        activeToolState = null;
        expect(component.isBrushSelected(brushWall)).toBeFalse();
    });

    it('isBrushSelected returns false when active tool is not TileBrushTool', () => {
        activeToolState = { type: ToolType.PlaceableTool, placeableKind: 0 as unknown as never };
        expect(component.isBrushSelected(brushWall)).toBeFalse();
    });

    it('isBrushSelected returns false when tileKind does not match', () => {
        activeToolState = {
            type: ToolType.TileBrushTool,
            tileKind: TileKind.BASE,
            leftDrag: false,
            rightDrag: false,
        };
        expect(component.isBrushSelected(brushWall)).toBeFalse();
    });

    it('isBrushSelected returns true when tileKind matches', () => {
        activeToolState = {
            type: ToolType.TileBrushTool,
            tileKind: TileKind.WALL,
            leftDrag: false,
            rightDrag: false,
        };
        expect(component.isBrushSelected(brushWall)).toBeTrue();
    });

    it('isBrushSelected returns false when active tool is TileBrushTool but lacks tileKind key', () => {
        const brush = { image: '/x.png', tileKind: TileKind.BASE, class: 'x' };
        const tool = { type: ToolType.TileBrushTool, leftDrag: false, rightDrag: false } as unknown as ActiveTool;
        Object.defineProperty(interactionsSpy, 'activeTool', {
            get: (): ActiveTool | null => tool,
            set: () => {
                /** no-op */
            },
            configurable: true,
        });
        expect(component.isBrushSelected(brush)).toBeFalse();
    });
});
