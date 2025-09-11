import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CreateGameDto } from '@app/api/model/createGameDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { of, throwError } from 'rxjs';
import { GameEditorPageComponent } from './game-editor-page.component';

describe('GameEditorPageComponent', () => {
  let component: GameEditorPageComponent;
  let fixture: ComponentFixture<GameEditorPageComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let gameHttpServiceSpy: jasmine.SpyObj<GameHttpService>;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const gameHttpSpyObj = jasmine.createSpyObj('GameHttpService', ['createGame']);

    await TestBed.configureTestingModule({
      imports: [GameEditorPageComponent],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: GameHttpService, useValue: gameHttpSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameEditorPageComponent);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    gameHttpServiceSpy = TestBed.inject(GameHttpService) as jasmine.SpyObj<GameHttpService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty values', () => {
    expect(component.gameName).toBe('');
    expect(component.gameDescription).toBe('');
    expect(component.isCreating).toBe(false);
  });

  it('should return false for isFormValid when fields are empty', () => {
    expect(component.isFormValid).toBe(false);
  });

  it('should return true for isFormValid when fields are filled', () => {
    component.gameName = 'Test Game';
    component.gameDescription = 'Test Description';
    expect(component.isFormValid).toBe(true);
  });

  it('should return false for isFormValid when fields contain only spaces', () => {
    component.gameName = '   ';
    component.gameDescription = '   ';
    expect(component.isFormValid).toBe(false);
  });

  it('should navigate back to game parameters', () => {
    component.onBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameParameters]);
  });

  it('should not create game when form is invalid', () => {
    component.gameName = '';
    component.gameDescription = '';

    component.onCreateGame();

    expect(gameHttpServiceSpy.createGame).not.toHaveBeenCalled();
  });

  it('should create game when form is valid', () => {
    component.gameName = 'Test Game';
    component.gameDescription = 'Test Description';
    gameHttpServiceSpy.createGame.and.returnValue(of(undefined));

    component.onCreateGame();

    const expectedDto: CreateGameDto = {
      name: 'Test Game',
      description: 'Test Description',
      size: CreateGameDto.SizeEnum.NUMBER_15,
      mode: CreateGameDto.ModeEnum.Classic
    };

    expect(component.isCreating).toBe(true);
    expect(gameHttpServiceSpy.createGame).toHaveBeenCalledWith(expectedDto);
  });

  it('should navigate to game management on successful creation', () => {
    component.gameName = 'Test Game';
    component.gameDescription = 'Test Description';
    gameHttpServiceSpy.createGame.and.returnValue(of(undefined));

    component.onCreateGame();

    expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.gameManagement]);
  });

  it('should handle creation error', () => {
    component.gameName = 'Test Game';
    component.gameDescription = 'Test Description';
    gameHttpServiceSpy.createGame.and.returnValue(throwError('Error'));

    component.onCreateGame();

    expect(component.isCreating).toBe(false);
  });

  it('should trim whitespace from inputs', () => {
    component.gameName = '  Test Game  ';
    component.gameDescription = '  Test Description  ';
    gameHttpServiceSpy.createGame.and.returnValue(of(undefined));

    component.onCreateGame();

    const expectedDto: CreateGameDto = {
      name: 'Test Game',
      description: 'Test Description',
      size: CreateGameDto.SizeEnum.NUMBER_15,
      mode: CreateGameDto.ModeEnum.Classic
    };

    expect(gameHttpServiceSpy.createGame).toHaveBeenCalledWith(expectedDto);
  });
});
