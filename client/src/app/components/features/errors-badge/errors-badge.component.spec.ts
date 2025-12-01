import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorsBadgeComponent } from './errors-badge.component';
import { GameEditorCheckService } from '@app/services/game-editor-check/game-editor-check.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { GameEditorIssuesEnum } from '@app/interfaces/game-editor.interface';

const EXPECTED_GAME_EDITOR_ERROR_COUNT = 3;

describe('ErrorsBadgeComponent', () => {
    let component: ErrorsBadgeComponent;
    let fixture: ComponentFixture<ErrorsBadgeComponent>;
    let mockGameEditorCheckService: jasmine.SpyObj<GameEditorCheckService>;
    let mockCharacterCreationCheckService: jasmine.SpyObj<CharacterCreationCheckService>;

    const mockGameEditorProblems = {
        [GameEditorIssuesEnum.TerrainCoverage]: { hasIssue: true, message: 'Terrain coverage error' },
        [GameEditorIssuesEnum.Doors]: { hasIssue: false, message: '', tiles: [] },
        [GameEditorIssuesEnum.TerrainAccessibility]: { hasIssue: true, message: 'Accessibility error', tiles: [] },
        [GameEditorIssuesEnum.StartPlacement]: { hasIssue: false, message: '' },
        [GameEditorIssuesEnum.FlagPlacement]: { hasIssue: true, message: 'Flag placement error' },
        [GameEditorIssuesEnum.NameValidation]: { hasIssue: false, message: '' },
        [GameEditorIssuesEnum.DescriptionValidation]: { hasIssue: false, message: '' },
        [GameEditorIssuesEnum.TeleportChannels]: { hasIssue: false, message: '' },
    };

    beforeEach(async () => {
        const gameEditorCheckServiceSpy = jasmine.createSpyObj('GameEditorCheckService', ['editorProblems']);
        const characterCreationCheckServiceSpy = jasmine.createSpyObj('CharacterCreationCheckService', ['getErrorMessages']);

        gameEditorCheckServiceSpy.editorProblems.and.returnValue(mockGameEditorProblems);
        characterCreationCheckServiceSpy.getErrorMessages.and.returnValue(['Character error 1', 'Character error 2']);

        await TestBed.configureTestingModule({
            imports: [ErrorsBadgeComponent],
            providers: [
                { provide: GameEditorCheckService, useValue: gameEditorCheckServiceSpy },
                { provide: CharacterCreationCheckService, useValue: characterCreationCheckServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ErrorsBadgeComponent);
        component = fixture.componentInstance;
        mockGameEditorCheckService = TestBed.inject(GameEditorCheckService) as jasmine.SpyObj<GameEditorCheckService>;
        mockCharacterCreationCheckService = TestBed.inject(CharacterCreationCheckService) as jasmine.SpyObj<CharacterCreationCheckService>;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default validation type as game-editor', () => {
        expect(component.validationType).toBe('game-editor');
    });

    it('should return character creation errors when validation type is character-creation', () => {
        component.validationType = 'character-creation';
        const errors = component.errorList;
        expect(errors).toEqual(['Character error 1', 'Character error 2']);
        expect(mockCharacterCreationCheckService.getErrorMessages).toHaveBeenCalled();
    });

    it('should return game editor errors when validation type is game-editor', () => {
        component.validationType = 'game-editor';
        const errors = component.errorList;
        expect(errors).toEqual(['Terrain coverage error', 'Accessibility error', 'Flag placement error']);
        expect(mockGameEditorCheckService.editorProblems).toHaveBeenCalled();
    });

    it('should return empty array when no game editor errors exist', () => {
        const noErrorsProblems = {
            [GameEditorIssuesEnum.TerrainCoverage]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.Doors]: { hasIssue: false, message: '', tiles: [] },
            [GameEditorIssuesEnum.TerrainAccessibility]: { hasIssue: false, message: '', tiles: [] },
            [GameEditorIssuesEnum.StartPlacement]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.FlagPlacement]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.NameValidation]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.DescriptionValidation]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.TeleportChannels]: { hasIssue: false, message: '' },
        };
        mockGameEditorCheckService.editorProblems.and.returnValue(noErrorsProblems);

        component.validationType = 'game-editor';
        const errors = component.errorList;
        expect(errors).toEqual([]);
    });

    it('should return correct error count for character creation', () => {
        component.validationType = 'character-creation';
        expect(component.errorCount).toBe(2);
    });

    it('should return correct error count for game editor', () => {
        component.validationType = 'game-editor';
        expect(component.errorCount).toBe(EXPECTED_GAME_EDITOR_ERROR_COUNT);
    });

    it('should return true for hasErrors when errors exist', () => {
        component.validationType = 'character-creation';
        expect(component.hasErrors).toBe(true);
    });

    it('should return false for hasErrors when no errors exist', () => {
        mockCharacterCreationCheckService.getErrorMessages.and.returnValue([]);
        component.validationType = 'character-creation';
        expect(component.hasErrors).toBe(false);
    });

    it('should handle problems with hasIssue true but no message', () => {
        const problemsWithNoMessage = {
            [GameEditorIssuesEnum.TerrainCoverage]: { hasIssue: true, message: '' },
            [GameEditorIssuesEnum.Doors]: { hasIssue: false, message: '', tiles: [] },
            [GameEditorIssuesEnum.TerrainAccessibility]: { hasIssue: false, message: '', tiles: [] },
            [GameEditorIssuesEnum.StartPlacement]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.FlagPlacement]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.NameValidation]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.DescriptionValidation]: { hasIssue: false, message: '' },
            [GameEditorIssuesEnum.TeleportChannels]: { hasIssue: false, message: '' },
        };
        mockGameEditorCheckService.editorProblems.and.returnValue(problemsWithNoMessage);

        component.validationType = 'game-editor';
        const errors = component.errorList;
        expect(errors).toEqual([]);
    });
});
