import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/services/notification/notification.service';

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have null notification initially', () => {
        expect(service.notification()).toBeNull();
    });

    it('should display error notification', () => {
        const errorData = { title: 'Error Title', message: 'Error Message' };

        service.displayError(errorData);

        const notification = service.notification();
        expect(notification).toEqual({ ...errorData, type: 'error' });
    });

    it('should display success notification', () => {
        const successData = { title: 'Success Title', message: 'Success Message' };

        service.displaySuccess(successData);

        const notification = service.notification();
        expect(notification).toEqual({ ...successData, type: 'success' });
    });

    it('should reset notification to null', () => {
        service.displayError({ title: 'Test', message: 'Test' });
        expect(service.notification()).not.toBeNull();

        service.reset();

        expect(service.notification()).toBeNull();
    });

    it('should override previous notification', () => {
        service.displayError({ title: 'Error', message: 'Error' });
        service.displaySuccess({ title: 'Success', message: 'Success' });

        const notification = service.notification();
        expect(notification?.type).toBe('success');
        expect(notification?.title).toBe('Success');
    });
});
