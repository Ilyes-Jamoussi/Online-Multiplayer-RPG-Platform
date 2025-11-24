import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionPreviewDto } from '@app/dto/session-preview-dto';
import { SessionCardComponent } from './session-card.component';

// Test constants
const TEST_SESSION_ID_1 = 'test-session-id-1';
const TEST_SESSION_ID_2 = 'test-session-id-2';
const TEST_CURRENT_PLAYERS_2 = 2;
const TEST_CURRENT_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_4 = 4;
const TEST_MAX_PLAYERS_6 = 6;
const TEST_SESSION_TITLE_PREFIX = 'Partie ';

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
            };
            component.session = session;
            fixture.detectChanges();

            spyOn(component.joinSession, 'emit');

            component.onJoinClick();

            expect(component.joinSession.emit).toHaveBeenCalledOnceWith(TEST_SESSION_ID_2);
        });
    });

    describe('Template rendering', () => {
        it('should render session title with session id', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
            };
            component.session = session;
            fixture.detectChanges();

            const sessionTitle = fixture.nativeElement.querySelector('.session-title');
            expect(sessionTitle).toBeTruthy();
            expect(sessionTitle.textContent.trim()).toBe(`${TEST_SESSION_TITLE_PREFIX}${TEST_SESSION_ID_1}`);
        });

        it('should render session players count', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
            };
            component.session = session;
            fixture.detectChanges();

            const sessionPlayers = fixture.nativeElement.querySelector('.session-players');
            expect(sessionPlayers).toBeTruthy();
            expect(sessionPlayers.textContent.trim()).toBe(`${TEST_CURRENT_PLAYERS_2} / ${TEST_MAX_PLAYERS_4} joueurs`);
        });

        it('should render join button', () => {
            const session: SessionPreviewDto = {
                id: TEST_SESSION_ID_1,
                currentPlayers: TEST_CURRENT_PLAYERS_2,
                maxPlayers: TEST_MAX_PLAYERS_4,
            };
            component.session = session;
            fixture.detectChanges();

            const joinButton = fixture.nativeElement.querySelector('app-ui-button');
            expect(joinButton).toBeTruthy();
        });
    });
});

