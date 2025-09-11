import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgStyle } from '@angular/common';
import { Observable, map } from 'rxjs';

import { GameEditorService } from '@app/pages/admin-page/edit-game-page/services/game-editor.service';
import { ActiveTool, Grid, InventoryState, TileActions } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';
import { EditGameToolbarComponent } from '@app/pages/admin-page/edit-game-page/components/toolbar/edit-game-toolbar.component';
import { EditGameTileComponent } from '@app/pages/admin-page/edit-game-page/components/tile/edit-game-tile.component';
import { EditorInventoryComponent } from '@app/pages/admin-page/edit-game-page/components/inventory/inventory.component';

@Component({
    selector: 'app-edit-game-page',
    standalone: true,
    imports: [AsyncPipe, NgStyle, EditGameToolbarComponent, EditGameTileComponent, EditorInventoryComponent],
    templateUrl: './edit-game-page.component.html',
    styleUrls: ['./edit-game-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditGamePageComponent implements OnInit {
    private readonly editor: GameEditorService = inject(GameEditorService);
    grid$!: Observable<Grid>;
    activeTool$!: Observable<ActiveTool>;
    inventory$!: Observable<InventoryState>;
    // precomputed index array for ngFor (avoids creating arrays in template)
    indices$!: Observable<number[]>;

    getX(index: number, width: number): number {
        return index % width;
    }

    getY(index: number, width: number): number {
        return Math.floor(index / width);
    }

    ngOnInit(): void {
        this.editor.initDraft('Nouveau jeu', 'Description…', 'l', 'CLASSIC', {
            x: 250,
            y: 250,
        });

        this.grid$ = this.editor.grid$;
        this.indices$ = this.grid$.pipe(map((g) => Array.from({ length: g.width * g.height }, (_, i) => i)));
        this.activeTool$ = this.editor.activeTool$;
        this.inventory$ = this.editor.inventory$;
    }

    trackByIndex = (_: number, i: number) => i;

    selectTool(tool: ActiveTool) {
        this.editor.setActiveTool(tool);
    }

    getCellSize(): number {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return 850 / 15;
    }

    readonly tileActions: Readonly<TileActions> = {
        leftClick: (x, y) => {
            this.editor.applyPaint(x, y);
        },
        rightClick: (x, y) => {
            this.editor.applyRightClick(x, y);
        },
        dragStart: (click: 'left' | 'right') => {
            this.editor.toggleDragging(click);
        },
        dragEnd: (click: 'left' | 'right') => {
            this.editor.toggleDragging(click);
        },
        dragPaint: (x, y) => {
            this.editor.dragPaint(x, y);
        },
    };
}
