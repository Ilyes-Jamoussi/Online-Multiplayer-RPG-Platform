import { Component } from '@angular/core';
import { GameEditorIssuesEnum } from '@app/interfaces/game-editor.interface';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';

@Component({
    selector: 'app-editor-errors-badge',
    standalone: true,
    templateUrl: './errors-display.component.html',
    styleUrls: ['./errors-display.component.scss'],
})
export class GameEditorErrorsDisplayComponent {
    constructor(readonly gameEditorCheckService: GameEditorCheckService) {}

    get errorList(): string[] {
        const problems = this.gameEditorCheckService.editorProblems();
        const messages: string[] = [];
        for (const issue of Object.values(GameEditorIssuesEnum)) {
            const problem = problems[issue];
            if (problem?.hasIssue && problem?.message) {
                messages.push(problem.message);
            }
        }
        return messages;
    }

    get errorCount(): number {
        return this.errorList.length;
    }

    get hasErrors(): boolean {
        return this.errorCount > 0;
    }
}
