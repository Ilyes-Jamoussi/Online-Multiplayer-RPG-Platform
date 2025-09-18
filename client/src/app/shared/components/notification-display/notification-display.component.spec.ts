import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ROUTES } from '@app/constants/routes.constants';
import { NotificationService } from '@app/services/notification/notification.service';
import { NotificationDisplayComponent } from './notification-display.component';

describe('NotificationDisplayComponent', () => {
    let component: NotificationDisplayComponent;
    let fixture: ComponentFixture<NotificationDisplayComponent>;
    let notificationService: jasmine.SpyObj<NotificationService>;
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
        notificationService = jasmine.createSpyObj('NotificationService', ['reset'], {
            notification: notificationSignal,
        });
        router = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [NotificationDisplayComponent, MatIconModule],
            providers: [
                { provide: NotificationService, useValue: notificationService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(NotificationDisplayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display error notification correctly', () => {
        // Set notification and trigger change detection
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

    it('should navigate to home and reset notification when clicking home button', () => {
        component.notification = signal(mockErrorNotification);
        fixture.detectChanges();

        const homeButton = fixture.debugElement.query(By.css('.notification-button'));
        expect(homeButton).toBeTruthy();
        
        homeButton.triggerEventHandler('click', null);

        expect(notificationService.reset).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([ROUTES.home]);
    });

    it('should not display anything when notification is null', () => {
        component.notification = signal(null);
        fixture.detectChanges();

        const container = fixture.debugElement.query(By.css('.notification-container'));
        expect(container).toBeFalsy();
    });

    // Test removed - goHome method no longer exists
});
