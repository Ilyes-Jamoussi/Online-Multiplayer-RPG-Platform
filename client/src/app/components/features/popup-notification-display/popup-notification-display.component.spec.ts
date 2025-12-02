import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ROUTES } from '@app/enums/routes.enum';
import { NotificationMessage } from '@app/interfaces/notification-message.interface';
import { NotificationService } from '@app/services/notification/notification.service';
import { PopupNotificationDisplayComponent } from './popup-notification-display.component';

describe('PopupNotificationDisplayComponent', () => {
    const firstCall = 0;
    const secondCall = 1;
    const singleCall = 1;
    const doubleCall = 2;

    let component: PopupNotificationDisplayComponent;
    let fixture: ComponentFixture<PopupNotificationDisplayComponent>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let notificationSignal: ReturnType<typeof signal<NotificationMessage | null>>;

    beforeEach(async () => {
        notificationSignal = signal<NotificationMessage | null>(null);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['resetPopup'], {
            notification: notificationSignal.asReadonly(),
        });
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [PopupNotificationDisplayComponent],
            providers: [
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PopupNotificationDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize notification signal from service', () => {
        expect(component.notification).toBe(notificationServiceSpy.notification);
    });

    describe('onAction', () => {
        it('should reset popup and navigate when redirectRoute is provided', () => {
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'success',
                redirectRoute: ROUTES.HomePage,
            };
            notificationSignal.set(mockNotification);

            component.onAction();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledTimes(singleCall);
            expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.HomePage]);
        });

        it('should reset popup without navigating when redirectRoute is not provided', () => {
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'error',
            };
            notificationSignal.set(mockNotification);

            component.onAction();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should handle null notification gracefully', () => {
            notificationSignal.set(null);

            component.onAction();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
    });

    describe('onConfirm', () => {
        it('should reset popup and call onConfirm callback when provided', () => {
            const mockCallback = jasmine.createSpy('onConfirm');
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'confirmation',
                onConfirm: mockCallback,
            };
            notificationSignal.set(mockNotification);

            component.onConfirm();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledTimes(singleCall);
        });

        it('should reset popup without calling callback when onConfirm is not provided', () => {
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'confirmation',
            };
            notificationSignal.set(mockNotification);

            component.onConfirm();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
        });

        it('should handle null notification gracefully', () => {
            notificationSignal.set(null);

            component.onConfirm();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
        });
    });

    describe('onCancel', () => {
        it('should reset popup and call onCancel callback when provided', () => {
            const mockCallback = jasmine.createSpy('onCancel');
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'confirmation',
                onCancel: mockCallback,
            };
            notificationSignal.set(mockNotification);

            component.onCancel();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledTimes(singleCall);
        });

        it('should reset popup without calling callback when onCancel is not provided', () => {
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'confirmation',
            };
            notificationSignal.set(mockNotification);

            component.onCancel();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
        });

        it('should handle null notification gracefully', () => {
            notificationSignal.set(null);

            component.onCancel();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
        });
    });

    describe('notification types', () => {
        it('should handle error notification type', () => {
            const mockNotification: NotificationMessage = {
                title: 'Error Title',
                message: 'Error Message',
                type: 'error',
            };
            notificationSignal.set(mockNotification);
            fixture.detectChanges();

            expect(component.notification()?.type).toBe('error');
        });

        it('should handle success notification type', () => {
            const mockNotification: NotificationMessage = {
                title: 'Success Title',
                message: 'Success Message',
                type: 'success',
            };
            notificationSignal.set(mockNotification);
            fixture.detectChanges();

            expect(component.notification()?.type).toBe('success');
        });

        it('should handle information notification type', () => {
            const mockNotification: NotificationMessage = {
                title: 'Info Title',
                message: 'Info Message',
                type: 'information',
            };
            notificationSignal.set(mockNotification);
            fixture.detectChanges();

            expect(component.notification()?.type).toBe('information');
        });

        it('should handle confirmation notification type', () => {
            const mockNotification: NotificationMessage = {
                title: 'Confirm Title',
                message: 'Confirm Message',
                type: 'confirmation',
            };
            notificationSignal.set(mockNotification);
            fixture.detectChanges();

            expect(component.notification()?.type).toBe('confirmation');
        });
    });

    describe('multiple actions sequence', () => {
        it('should handle multiple onAction calls correctly', () => {
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'success',
                redirectRoute: ROUTES.ManagementPage,
            };
            notificationSignal.set(mockNotification);

            component.onAction();
            notificationSignal.set(mockNotification);
            component.onAction();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalledTimes(doubleCall);
            expect(routerSpy.navigate).toHaveBeenCalledTimes(doubleCall);
            expect(routerSpy.navigate.calls.argsFor(firstCall)).toEqual([[ROUTES.ManagementPage]]);
            expect(routerSpy.navigate.calls.argsFor(secondCall)).toEqual([[ROUTES.ManagementPage]]);
        });

        it('should handle onConfirm and onCancel in sequence', () => {
            const confirmCallback = jasmine.createSpy('confirm');
            const cancelCallback = jasmine.createSpy('cancel');
            const mockNotification: NotificationMessage = {
                title: 'Test Title',
                message: 'Test Message',
                type: 'confirmation',
                onConfirm: confirmCallback,
                onCancel: cancelCallback,
            };
            notificationSignal.set(mockNotification);

            component.onConfirm();
            notificationSignal.set(mockNotification);
            component.onCancel();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalledTimes(doubleCall);
            expect(confirmCallback).toHaveBeenCalledTimes(singleCall);
            expect(cancelCallback).toHaveBeenCalledTimes(singleCall);
        });
    });

    describe('edge cases', () => {
        it('should handle notification with all optional properties', () => {
            const confirmCallback = jasmine.createSpy('confirm');
            const cancelCallback = jasmine.createSpy('cancel');
            const mockNotification: NotificationMessage = {
                title: 'Full Title',
                message: 'Full Message',
                type: 'confirmation',
                redirectRoute: ROUTES.EditorPage,
                onConfirm: confirmCallback,
                onCancel: cancelCallback,
            };
            notificationSignal.set(mockNotification);

            component.onAction();

            expect(notificationServiceSpy.resetPopup).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalledWith([ROUTES.EditorPage]);
        });

        it('should handle notification change after component initialization', () => {
            const initialNotification: NotificationMessage = {
                title: 'Initial',
                message: 'Initial Message',
                type: 'information',
            };
            notificationSignal.set(initialNotification);
            fixture.detectChanges();

            const updatedNotification: NotificationMessage = {
                title: 'Updated',
                message: 'Updated Message',
                type: 'success',
            };
            notificationSignal.set(updatedNotification);
            fixture.detectChanges();

            expect(component.notification()?.title).toBe('Updated');
            expect(component.notification()?.message).toBe('Updated Message');
        });
    });
});
