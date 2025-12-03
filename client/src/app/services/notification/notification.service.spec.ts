/* eslint-disable @typescript-eslint/no-empty-function -- Some functions are mocked as empty functions */
import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationSocketService } from '@app/services/notification-socket/notification-socket.service';
import { ROUTES } from '@app/enums/routes.enum';

const TEST_DURATION_1000 = 1000;
const TEST_DURATION_2000 = 2000;
const TEST_DURATION_3000 = 3000;
const TEST_DURATION_5000 = 5000;

describe('NotificationService', () => {
    let service: NotificationService;
    let mockNotificationSocketService: jasmine.SpyObj<NotificationSocketService>;
    let errorMessageCallback: (message: string) => void;

    beforeEach(() => {
        mockNotificationSocketService = jasmine.createSpyObj('NotificationSocketService', ['onErrorMessage']);
        mockNotificationSocketService.onErrorMessage.and.callFake((callback: (message: string) => void) => {
            errorMessageCallback = callback;
        });

        TestBed.configureTestingModule({
            providers: [{ provide: NotificationSocketService, useValue: mockNotificationSocketService }],
        });
        service = TestBed.inject(NotificationService);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Popup Notifications', () => {
        it('should display error popup', () => {
            const error = { title: 'Error', message: 'Test error' };
            service.displayErrorPopup(error);

            const notification = service.notification();
            expect(notification).toEqual({ ...error, type: 'error' });
        });

        it('should display success popup', () => {
            const success = { title: 'Success', message: 'Test success' };
            service.displaySuccessPopup(success);

            const notification = service.notification();
            expect(notification).toEqual({ ...success, type: 'success' });
        });

        it('should display information popup', () => {
            const info = { title: 'Info', message: 'Test info' };
            service.displayInformationPopup(info);

            const notification = service.notification();
            expect(notification).toEqual({ ...info, type: 'information' });
        });

        it('should display popup with redirect route', () => {
            const error = { title: 'Error', message: 'Test error', redirectRoute: ROUTES.HomePage };
            service.displayErrorPopup(error);

            const notification = service.notification();
            expect(notification?.redirectRoute).toBe(ROUTES.HomePage);
        });

        it('should reset popup', () => {
            service.displayErrorPopup({ title: 'Error', message: 'Test' });
            expect(service.notification()).not.toBeNull();

            service.resetPopup();
            expect(service.notification()).toBeNull();
        });

        it('should display confirmation popup', () => {
            const confirmation = { title: 'Confirm', message: 'Are you sure?', onConfirm: () => {} };
            service.displayConfirmationPopup(confirmation);

            const notification = service.notification();
            expect(notification).toEqual({ ...confirmation, type: 'confirmation' });
        });
    });

    describe('Socket Listeners', () => {
        it('should display error popup when receiving error message from socket', () => {
            const errorMessage = 'Socket error message';
            errorMessageCallback(errorMessage);

            const notification = service.notification();
            expect(notification).toEqual({
                title: 'Erreur',
                message: errorMessage,
                redirectRoute: ROUTES.HomePage,
                type: 'error',
            });
        });
    });

    describe('Toast Notifications', () => {
        it('should show toast with default type and duration', () => {
            service.showToast('Test message');

            const toasts = service.toasts();
            expect(toasts.length).toBe(1);
            expect(toasts[0].message).toBe('Test message');
            expect(toasts[0].type).toBe('info');
            expect(toasts[0].id).toBe('toast-0');
        });

        it('should show toast with custom type and duration', () => {
            service.showToast('Test message', 'error', TEST_DURATION_5000);

            const toasts = service.toasts();
            expect(toasts[0].type).toBe('error');
            expect(toasts[0].duration).toBe(TEST_DURATION_5000);
        });

        it('should show info toast', () => {
            service.showInfoToast('Info message');

            const toasts = service.toasts();
            expect(toasts[0].type).toBe('info');
            expect(toasts[0].message).toBe('Info message');
        });

        it('should show success toast', () => {
            service.showSuccessToast('Success message');

            const toasts = service.toasts();
            expect(toasts[0].type).toBe('success');
        });

        it('should auto-remove toast after duration', () => {
            service.showToast('Test message', 'info', TEST_DURATION_1000);
            expect(service.toasts().length).toBe(1);

            jasmine.clock().tick(TEST_DURATION_1000);
            expect(service.toasts().length).toBe(0);
        });

        it('should not auto-remove toast with zero duration', () => {
            service.showToast('Test message', 'info', 0);
            expect(service.toasts().length).toBe(1);

            jasmine.clock().tick(TEST_DURATION_5000);
            expect(service.toasts().length).toBe(1);
        });

        it('should generate unique toast IDs', () => {
            service.showToast('Message 1');
            service.showToast('Message 2');

            const toasts = service.toasts();
            expect(toasts[0].id).toBe('toast-0');
            expect(toasts[1].id).toBe('toast-1');
        });

        it('should remove specific toast by ID', () => {
            service.showToast('Message 1');
            service.showToast('Message 2');
            expect(service.toasts().length).toBe(2);

            service.removeToast('toast-0');
            const toasts = service.toasts();
            expect(toasts.length).toBe(1);
            expect(toasts[0].id).toBe('toast-1');
        });

        it('should handle removing non-existent toast', () => {
            service.showToast('Message 1');
            expect(service.toasts().length).toBe(1);

            service.removeToast('non-existent-id');
            expect(service.toasts().length).toBe(1);
        });
    });

    describe('Toast with Custom Duration', () => {
        it('should use custom duration for specific toast methods', () => {
            service.showInfoToast('Info', TEST_DURATION_2000);
            service.showSuccessToast('Success', TEST_DURATION_3000);

            const toasts = service.toasts();
            expect(toasts[0].duration).toBe(TEST_DURATION_2000);
            expect(toasts[1].duration).toBe(TEST_DURATION_3000);
        });
    });
});
