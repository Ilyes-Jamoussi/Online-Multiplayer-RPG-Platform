import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminModeService } from '@app/services/admin-mode/admin-mode.service';
import { AdminBadgeComponent } from './admin-badge.component';

describe('AdminBadgeComponent', () => {
    let component: AdminBadgeComponent;
    let fixture: ComponentFixture<AdminBadgeComponent>;
    let mockAdminModeService: jasmine.SpyObj<AdminModeService>;

    beforeEach(async () => {
        mockAdminModeService = jasmine.createSpyObj('AdminModeService', ['isAdminModeActivated']);

        await TestBed.configureTestingModule({
            imports: [AdminBadgeComponent],
            providers: [
                { provide: AdminModeService, useValue: mockAdminModeService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminBadgeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return true when admin mode is activated', () => {
        mockAdminModeService.isAdminModeActivated.and.returnValue(true);
        expect(component.isAdminModeActivated).toBe(true);
    });

    it('should return false when admin mode is not activated', () => {
        mockAdminModeService.isAdminModeActivated.and.returnValue(false);
        expect(component.isAdminModeActivated).toBe(false);
    });
});