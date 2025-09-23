import { Component } from '@angular/core';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';

@Component({
    selector: 'app-editor-errors-badge',
    standalone: true,
    templateUrl: './errors-display.component.html',
    styleUrls: ['./errors-display.component.scss'],
})
export class GameEditorErrorsDisplayComponent {
    constructor(readonly editorCheck: GameEditorCheckService) {}

    get errorList(): string[] {
        const problems = this.editorCheck.editorProblems();
        const messages: string[] = [];
        if (problems.terrainCoverage.hasIssue && problems.terrainCoverage.message) messages.push(problems.terrainCoverage.message);
        if (problems.doors.hasIssue && problems.doors.message) messages.push(problems.doors.message);
        if (problems.terrainAccessibility.hasIssue && problems.terrainAccessibility.message) messages.push(problems.terrainAccessibility.message);
        if (problems.startPlacement.hasIssue && problems.startPlacement.message) messages.push(problems.startPlacement.message);
        return messages;
    }

    get errorCount(): number {
        return this.errorList.length;
    }

    get hasErrors(): boolean {
        return this.errorCount > 0;
    }
}
