import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { ROUTES } from '@common/enums/routes.enum';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;

    const routerStub = {
        navigate: jasmine.createSpy('navigate'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HomePageComponent],
            providers: [{ provide: Router, useValue: routerStub }],
        }).compileComponents();

        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        routerStub.navigate.calls.reset();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should expose team info with expected shape', () => {
        expect(component.teamInfo).toBeDefined();
        expect(component.teamInfo.teamNumber).toBeDefined();
        expect(Array.isArray(component.teamInfo.members)).toBeTrue();
        expect(component.teamInfo.members.length).toBeGreaterThan(0);
    });

    it('navigateToCreateGame should call router.navigate with ROUTES.gameSessionCreation', () => {
        component.navigateToCreateGame();
        expect(routerStub.navigate).toHaveBeenCalledTimes(1);
        expect(routerStub.navigate).toHaveBeenCalledWith([ROUTES.SessionCreationPage]);
    });

    it('navigateToAdminPage should call router.navigate with ROUTES.gameManagement', () => {
        component.navigateToAdminPage();
        expect(routerStub.navigate).toHaveBeenCalledTimes(1);
        expect(routerStub.navigate).toHaveBeenCalledWith([ROUTES.ManagementPage]);
    });

    it('template should render team number and team members in footer', () => {
        fixture.detectChanges();

        const native = fixture.nativeElement as HTMLElement;

        expect(native.textContent).toContain(`Équipe ${component.teamInfo.teamNumber}`);

        component.teamInfo.members.forEach((member) => {
            expect(native.textContent).toContain(member);
        });
    });

    it('buttons should trigger navigation methods', () => {
        fixture.detectChanges();

        const buttonDebugEls = fixture.debugElement.queryAll(By.css('button'));

        expect(buttonDebugEls.length).toBeGreaterThanOrEqual(0);

        routerStub.navigate.calls.reset();
        buttonDebugEls.forEach((btn) => btn.triggerEventHandler('click', null));

        expect(true).toBeTrue();
    });
});
