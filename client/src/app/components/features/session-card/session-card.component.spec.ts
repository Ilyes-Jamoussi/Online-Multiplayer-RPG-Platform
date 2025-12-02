import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { SessionCardComponent } from './session-card.component';

const TEST_SESSION_ID_1 = 'test-session-id-1';
const TEST_SESSION_ID_2 = 'test-session-id-2';
const TEST_CURRENT_PLAYERS_2 = 2;
const TEST_CURRENT_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_6 = 6;
const TEST_GAME_NAME_1 = 'Test Game 1';
const TEST_GAME_NAME_2 = 'Test Game 2';
const TEST_GAME_DESCRIPTION_1 = 'Test game description 1';
const TEST_GAME_DESCRIPTION_2 = 'Test game description 2';

describe('SessionCardComponent', () => {
    let component: SessionCardComponent;
    let fixture: ComponentFixture<SessionCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SessionCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SessionCardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Input session', () => {
        it('should accept session input', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            expect(component.session.id).toBe(TEST_SESSION_ID_1);
            expect(component.session.currentPlayers).toBe(TEST_CURRENT_PLAYERS_2);
            expect(component.session.maxPlayers).toBe(TEST_MAX_PLAYERS_4);
        });

        it('should accept different session input', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_2,
                currentPlayers: TEST_CURRENT_PLAYERS_4,
                maxPlayers: TEST_MAX_PLAYERS_6,
                gameName: TEST_GAME_NAME_2,
                gameDescription: TEST_GAME_DESCRIPTION_2,
                mapSize: MapSize.MEDIUM,
                gameMode: GameMode.CTF,
            };
            component.session = session;
            fixture.detectChanges();

            expect(component.session.id).toBe(TEST_SESSION_ID_2);
            expect(component.session.currentPlayers).toBe(TEST_CURRENT_PLAYERS_4);
            expect(component.session.maxPlayers).toBe(TEST_MAX_PLAYERS_6);
        });
    });

    describe('onJoinClick', () => {
        it('should emit joinSession event with session id', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            spyOn(component.joinSession, 'emit');

            component.onJoinClick();

            expect(component.joinSession.emit).toHaveBeenCalledOnceWith(TEST_SESSION_ID_1);
        });

        it('should emit joinSession event with different session id', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_2,
                currentPlayers: TEST_CURRENT_PLAYERS_4,
                maxPlayers: TEST_MAX_PLAYERS_6,
                gameName: TEST_GAME_NAME_2,
                gameDescription: TEST_GAME_DESCRIPTION_2,
                mapSize: MapSize.MEDIUM,
                gameMode: GameMode.CTF,
            };
            component.session = session;
            fixture.detectChanges();

            spyOn(component.joinSession, 'emit');

            component.onJoinClick();

            expect(component.joinSession.emit).toHaveBeenCalledOnceWith(TEST_SESSION_ID_2);
        });
    });

    describe('Template rendering', () => {
        it('should render game name', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            const gameName = fixture.nativeElement.querySelector('.game-name');
            expect(gameName).toBeTruthy();
            expect(gameName.textContent.trim()).toBe(TEST_GAME_NAME_1);
        });

        it('should render session players count', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            const playersBadge = fixture.nativeElement.querySelector('.players-badge');
            expect(playersBadge).toBeTruthy();
            const playersText = playersBadge.querySelector('span');
            expect(playersText).toBeTruthy();
            expect(playersText.textContent.trim()).toBe(`${TEST_CURRENT_PLAYERS_2}/${TEST_MAX_PLAYERS_4}`);
        });

        it('should render game description', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            const gameDescription = fixture.nativeElement.querySelector('.game-description');
            expect(gameDescription).toBeTruthy();
            expect(gameDescription.textContent.trim()).toBe(TEST_GAME_DESCRIPTION_1);
        });

        it('should render formatted map size', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            const infoItems = fixture.nativeElement.querySelectorAll('.info-item');
            expect(infoItems.length).toBeGreaterThan(0);
            const mapSizeText = Array.from<Element>(infoItems).find((item: Element) => item.textContent?.includes('Petite'));
            expect(mapSizeText).toBeTruthy();
        });

        it('should render join button', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
                gameName: TEST_GAME_NAME_1,
                gameDescription: TEST_GAME_DESCRIPTION_1,
                mapSize: MapSize.SMALL,
                gameMode: GameMode.CLASSIC,
            };
            component.session = session;
            fixture.detectChanges();

            const joinButton = fixture.nativeElement.querySelector('app-ui-button');
            expect(joinButton).toBeTruthy();
        });
    });
});
