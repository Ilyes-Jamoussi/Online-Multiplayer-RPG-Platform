import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationCoordinatorService } from '@app/services/notification-coordinator/notification-coordinator.service';
import { ToastNotificationDisplayComponent } from './toast-notification-display.component';
import { Toast } from '@app/interfaces/toast.interface';

describe('ToastNotificationDisplayComponent', () => {
    let component: ToastNotificationDisplayComponent;
    let fixture: ComponentFixture<ToastNotificationDisplayComponent>;
    let mockNotificationService: jasmine.SpyObj<NotificationCoordinatorService>;

    const mockToasts: Toast[] = [
        { id: '1', message: 'Test toast 1', type: 'info' },
        { id: '2', message: 'Test toast 2', type: 'success' },
    ];

    beforeEach(async () => {
        mockNotificationService = jasmine.createSpyObj('NotificationCoordinatorService', ['removeToast'], {
            toasts: signal(mockToasts),
        });

        await TestBed.configureTestingModule({
            imports: [ToastNotificationDisplayComponent],
            providers: [{ provide: NotificationCoordinatorService, useValue: mockNotificationService }],
        }).compileComponents();

        fixture = TestBed.createComponent(ToastNotificationDisplayComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return toasts from notification service', () => {
        expect(component.toasts).toEqual(mockToasts);
    });

    it('should call removeToast on notification service', () => {
        component.removeToast('test-id');
        expect(mockNotificationService.removeToast).toHaveBeenCalledWith('test-id');
    });
});
