import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { PopupNotificationDisplayComponent } from './popup-notification-display.component';

describe('NotificationDisplayComponent', () => {
    let component: PopupNotificationDisplayComponent;
    let fixture: ComponentFixture<PopupNotificationDisplayComponent>;
    let notificationCoordinatorService: jasmine.SpyObj<NotificationCoordinatorService>;
    let router: jasmine.SpyObj<Router>;

    const mockErrorNotification = {
        type: 'error' as const,
        title: 'Error Title',
        message: 'Error Message',
    };

    const mockSuccessNotification = {
        type: 'success' as const,
        title: 'Success Title',
        message: 'Success Message',
    };

    const mockInfoNotification = {
        type: 'information' as const,
        title: 'Info Title',
        message: 'Info Message',
    };

    beforeEach(async () => {
        const notificationSignal = signal(null);
        notificationCoordinatorService = jasmine.createSpyObj('NotificationCoordinatorService', ['resetPopup'], {
            notification: notificationSignal,
        });
        router = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [PopupNotificationDisplayComponent, MatIconModule],
            providers: [
                { provide: NotificationCoordinatorService, useValue: notificationCoordinatorService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PopupNotificationDisplayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display error notification correctly', () => {
        component.notification = signal(mockErrorNotification);
        fixture.detectChanges();

        const card = fixture.debugElement.query(By.css('.notification-card'));
        const title = fixture.debugElement.query(By.css('.notification-title'));
        const message = fixture.debugElement.query(By.css('.notification-message'));
        const icon = fixture.debugElement.query(By.css('i'));

        expect(card).toBeTruthy();
        expect(card.classes['error']).toBeTruthy();
        expect(title.nativeElement.textContent).toBe(mockErrorNotification.title);
        expect(message.nativeElement.textContent).toBe(mockErrorNotification.message);
        expect(icon.nativeElement.textContent).toBe('error_outline');
    });

    it('should display success notification correctly', () => {
        component.notification = signal(mockSuccessNotification);
        fixture.detectChanges();

        const card = fixture.debugElement.query(By.css('.notification-card'));
        const title = fixture.debugElement.query(By.css('.notification-title'));
        const message = fixture.debugElement.query(By.css('.notification-message'));
        const icon = fixture.debugElement.query(By.css('i'));

        expect(card).toBeTruthy();
        expect(card.classes['success']).toBeTruthy();
        expect(title.nativeElement.textContent).toBe(mockSuccessNotification.title);
        expect(message.nativeElement.textContent).toBe(mockSuccessNotification.message);
        expect(icon.nativeElement.textContent).toBe('check_circle');
    });

    it('should display information notification correctly', () => {
        component.notification = signal(mockInfoNotification);
        fixture.detectChanges();

        const card = fixture.debugElement.query(By.css('.notification-card'));
        const title = fixture.debugElement.query(By.css('.notification-title'));
        const message = fixture.debugElement.query(By.css('.notification-message'));
        const icon = fixture.debugElement.query(By.css('i'));

        expect(card).toBeTruthy();
        expect(card.classes['information']).toBeTruthy();
        expect(title.nativeElement.textContent).toBe(mockInfoNotification.title);
        expect(message.nativeElement.textContent).toBe(mockInfoNotification.message);
        expect(icon.nativeElement.textContent).toBe('info');
    });

    it('should reset notification and navigate when onAction is called with redirectRoute', () => {
        const mockNotificationWithRedirect = {
            type: 'error' as const,
            title: 'Error Title',
            message: 'Error Message',
            redirectRoute: ROUTES.HomePage
        };

        component.notification = signal(mockNotificationWithRedirect);
        fixture.detectChanges();

        component.onAction();

        expect(notificationCoordinatorService.resetPopup).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
    });

    it('should not display anything when notification is null', () => {
        component.notification = signal(null);
        fixture.detectChanges();

        const container = fixture.debugElement.query(By.css('.notification-container'));
        expect(container).toBeFalsy();
    });
});
