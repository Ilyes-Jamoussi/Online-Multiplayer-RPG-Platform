import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesibilityIssue, EditorIssue, GameEditorIssuesEnum } from '@app/interfaces/game-editor.interface';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { ErrorsBadgeComponent } from './errors-badge.component';

class StubCharacterCreationCheckService {
    private readonly messages = ['err1', 'err2'];
    getErrorMessages(): string[] {
        return [...this.messages];
    }
}

class StubGameEditorCheckService {
    private problems: Record<string, EditorIssue | AccesibilityIssue> = {};

    constructor() {
        for (const k of Object.values(GameEditorIssuesEnum)) {
            if (k === GameEditorIssuesEnum.Doors || k === GameEditorIssuesEnum.TerrainAccessibility) {
                this.problems[k as GameEditorIssuesEnum] = { hasIssue: false, tiles: [] } as AccesibilityIssue;
            } else {
                this.problems[k as GameEditorIssuesEnum] = { hasIssue: false } as EditorIssue;
            }
        }
    }

    setProblem(issue: GameEditorIssuesEnum, message?: string) {
        if (issue === GameEditorIssuesEnum.Doors || issue === GameEditorIssuesEnum.TerrainAccessibility) {
            this.problems[issue] = { hasIssue: !!message, message, tiles: [] } as AccesibilityIssue;
        } else {
            this.problems[issue] = { hasIssue: !!message, message } as EditorIssue;
        }
    }

    editorProblems(): Record<string, EditorIssue | AccesibilityIssue> {
        return this.problems;
    }
}

describe('ErrorsBadgeComponent', () => {
    let fixture: ComponentFixture<ErrorsBadgeComponent>;
    let component: ErrorsBadgeComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ErrorsBadgeComponent],
        });
    });

    it('should create and have no errors by default', async () => {
        await TestBed.compileComponents();
        fixture = TestBed.createComponent(ErrorsBadgeComponent);
        component = fixture.componentInstance;

        expect(component).toBeTruthy();
        expect(component.errorList).toEqual([]);
        expect(component.errorCount).toBe(0);
        expect(component.hasErrors).toBeFalse();
    });

    it('should return character creation errors when validationType is character-creation and service provided', async () => {
        const charService = new StubCharacterCreationCheckService();
        TestBed.overrideProvider(CharacterCreationCheckService, { useValue: charService });
        await TestBed.compileComponents();
        fixture = TestBed.createComponent(ErrorsBadgeComponent);
        component = fixture.componentInstance;
        component.validationType = 'character-creation';

        expect(component.errorList).toEqual(charService.getErrorMessages());
        expect(component.errorCount).toBe(charService.getErrorMessages().length);
        expect(component.hasErrors).toBeTrue();
    });

    it('should return game-editor error messages when provided by GameEditorCheckService', async () => {
        const editorStub = new StubGameEditorCheckService();
        const issues = Object.values(GameEditorIssuesEnum) as GameEditorIssuesEnum[];
        editorStub.setProblem(issues[0], 'first-message');
        editorStub.setProblem(issues[1], 'second-message');

        TestBed.overrideProvider(GameEditorCheckService, { useValue: editorStub });
        await TestBed.compileComponents();
        fixture = TestBed.createComponent(ErrorsBadgeComponent);
        component = fixture.componentInstance;
        component.validationType = 'game-editor';

        const expected = Object.values(GameEditorIssuesEnum)
            .map((k) => editorStub.editorProblems()[k] as EditorIssue | AccesibilityIssue | undefined)
            .filter((p): p is EditorIssue | AccesibilityIssue => !!p && p.hasIssue && !!p.message)
            .map((p) => p.message as string);

        expect(component.errorList).toEqual(expected);
        expect(component.errorCount).toBe(expected.length);
        expect(component.hasErrors).toBeTrue();
    });
});

