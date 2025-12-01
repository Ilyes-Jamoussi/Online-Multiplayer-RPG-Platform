import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { ResetService } from '@app/services/reset/reset.service';
import { HomePageComponent } from './home-page.component';

const MOCK_TEAM_NUMBER = '204';
const MOCK_MEMBER_1 = 'Wael El Karoui';
const MOCK_MEMBER_2 = 'Ilyes Jamoussi';
const MOCK_MEMBER_3 = 'Noah Blanchard';
const MOCK_MEMBER_4 = 'Adam Rafai';
const MOCK_MEMBER_5 = 'Eduard Andrei Podaru';
const EXPECTED_MEMBERS_COUNT = 5;

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockResetService: jasmine.SpyObj<ResetService>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockResetService = jasmine.createSpyObj('ResetService', ['triggerReset']);

        await TestBed.configureTestingModule({
            imports: [HomePageComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: ResetService, useValue: mockResetService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize teamInfo with correct team number', () => {
        expect(component.teamInfo.teamNumber).toBe(MOCK_TEAM_NUMBER);
    });

    it('should initialize teamInfo with correct members', () => {
        expect(component.teamInfo.members).toEqual([
            MOCK_MEMBER_1,
            MOCK_MEMBER_2,
            MOCK_MEMBER_3,
            MOCK_MEMBER_4,
            MOCK_MEMBER_5,
        ]);
    });

    it('should have correct number of members', () => {
        expect(component.teamInfo.members.length).toBe(EXPECTED_MEMBERS_COUNT);
    });

    describe('ngOnInit', () => {
        it('should call triggerReset on ResetService', () => {
            component.ngOnInit();

            expect(mockResetService.triggerReset).toHaveBeenCalled();
        });
    });

    describe('navigateToCreateGame', () => {
        it('should navigate to SessionCreationPage', () => {
            component.navigateToCreateGame();

            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.SessionCreationPage]);
        });
    });

    describe('navigateToAdminPage', () => {
        it('should navigate to ManagementPage', () => {
            component.navigateToAdminPage();

            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.ManagementPage]);
        });
    });

    describe('navigateToJoinGame', () => {
        it('should navigate to JoinSessionPage', () => {
            component.navigateToJoinGame();

            expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.JoinSessionPage]);
        });
    });
});



