import { Component, Input, Optional } from '@angular/core';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { GameEditorIssuesEnum } from '@app/interfaces/game-editor.interface';

@Component({
    selector: 'app-errors-badge',
    standalone: true,
    templateUrl: './errors-badge.component.html',
    styleUrls: ['./errors-badge.component.scss'],
})
export class ErrorsBadgeComponent {
    @Input() validationType: 'game-editor' | 'character-creation' = 'game-editor';

    constructor(
        @Optional() private readonly gameEditorCheckService: GameEditorCheckService,
        @Optional() private readonly characterCreationCheckService: CharacterCreationCheckService,
    ) {}

    get errorList(): string[] {
        if (this.validationType === 'character-creation') {
            return this.characterCreationCheckService.getErrorMessages();
        }

        // Default case: 'game-editor'
        const problems = this.gameEditorCheckService.editorProblems();
        const messages: string[] = [];
        for (const issue of Object.values(GameEditorIssuesEnum)) {
            const problem = problems[issue];
            if (problem.hasIssue && problem.message) {
                messages.push(problem.message);
            }
        }
        return messages;

        return [];
    }

    get errorCount(): number {
        return this.errorList.length;
    }

    get hasErrors(): boolean {
        return this.errorCount > 0;
    }
}
