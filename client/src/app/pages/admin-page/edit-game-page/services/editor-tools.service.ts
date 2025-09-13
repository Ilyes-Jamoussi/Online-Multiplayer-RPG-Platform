import { Injectable } from '@angular/core';
import { GameDraftService } from '@app/pages/admin-page/edit-game-page/services/game-draft.service';
import { ActiveTool } from '@app/pages/admin-page/edit-game-page/interfaces/game-editor.interface';

@Injectable({
    providedIn: 'root',
})
export class EditorToolsService {
    constructor(private readonly draftService: GameDraftService) {}

    setActiveTool(tool: ActiveTool): void {
        this.draftService.update((draft) => ({
            ...draft,
            editor: { ...draft.editor, activeTool: tool },
        }));
    }

    toggleDragging(click: 'left' | 'right'): void {
        this.draftService.update((draft) => {
            const tool = draft.editor?.activeTool;
            if (!tool || tool.type !== 'TILE_BRUSH') return draft;
            return {
                ...draft,
                editor: {
                    ...draft.editor,
                    activeTool: {
                        ...tool,
                        leftDrag: click === 'left' ? !tool.leftDrag : tool.leftDrag,
                        rightDrag: click === 'right' ? !tool.rightDrag : tool.rightDrag,
                    },
                },
            };
        });
    }
}
