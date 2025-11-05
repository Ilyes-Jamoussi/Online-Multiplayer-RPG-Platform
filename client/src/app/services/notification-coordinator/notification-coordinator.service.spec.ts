import { TestBed } from '@angular/core/testing';
import { NotificationCoordinatorService } from './notification-coordinator.service';
import { ROUTES } from '@app/enums/routes.enum';

const TEST_DURATION_1000 = 1000;
const TEST_DURATION_2000 = 2000;
const TEST_DURATION_3000 = 3000;
const TEST_DURATION_4000 = 4000;
const TEST_DURATION_5000 = 5000;

describe('NotificationCoordinatorService', () => {
    let service: NotificationCoordinatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NotificationCoordinatorService);
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

        it('should show warning toast', () => {
            service.showWarningToast('Warning message');

            const toasts = service.toasts();
            expect(toasts[0].type).toBe('warning');
        });

        it('should show error toast', () => {
            service.showErrorToast('Error message');

            const toasts = service.toasts();
            expect(toasts[0].type).toBe('error');
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

        it('should remove all toasts', () => {
            service.showToast('Message 1');
            service.showToast('Message 2');
            expect(service.toasts().length).toBe(2);

            service.removeToasts();
            expect(service.toasts().length).toBe(0);
        });

        it('should handle removing non-existent toast', () => {
            service.showToast('Message 1');
            expect(service.toasts().length).toBe(1);

            service.removeToast('non-existent-id');
            expect(service.toasts().length).toBe(1);
        });
    });

    describe('Reset All Notifications', () => {
        it('should reset both popup and toasts', () => {
            service.displayErrorPopup({ title: 'Error', message: 'Test' });
            service.showToast('Toast message');

            expect(service.notification()).not.toBeNull();
            expect(service.toasts().length).toBe(1);

            service.resetNotifications();

            expect(service.notification()).toBeNull();
            expect(service.toasts().length).toBe(0);
        });
    });

    describe('Toast with Custom Duration', () => {
        it('should use custom duration for specific toast methods', () => {
            service.showInfoToast('Info', TEST_DURATION_2000);
            service.showSuccessToast('Success', TEST_DURATION_3000);
            service.showWarningToast('Warning', TEST_DURATION_4000);
            service.showErrorToast('Error', TEST_DURATION_5000);

            const toasts = service.toasts();
            expect(toasts[0].duration).toBe(TEST_DURATION_2000);
            expect(toasts[1].duration).toBe(TEST_DURATION_3000);
            expect(toasts[2].duration).toBe(TEST_DURATION_4000);
            expect(toasts[3].duration).toBe(TEST_DURATION_5000);
        });
    });
});
