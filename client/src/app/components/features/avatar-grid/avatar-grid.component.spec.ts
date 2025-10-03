import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionService } from '@app/services/session/session.service';
import { AvatarName } from '@common/enums/avatar-name.enum';
import { AvatarAssignment } from '@common/models/session.model';
import { AvatarGridComponent } from './avatar-grid.component';

describe('AvatarGridComponent', () => {
    let component: AvatarGridComponent;
    let fixture: ComponentFixture<AvatarGridComponent>;
    let sessionService: jasmine.SpyObj<SessionService>;
    const mockAssignments: AvatarAssignment[] = [
        { avatarName: AvatarName.Avatar1, chosenBy: null },
        { avatarName: AvatarName.Avatar2, chosenBy: 'player1' },
    ];

    beforeEach(async () => {
        sessionService = jasmine.createSpyObj('SessionService', ['avatarAssignments']);
        sessionService.avatarAssignments.and.returnValue(mockAssignments);

        await TestBed.configureTestingModule({
            imports: [AvatarGridComponent],
            providers: [{ provide: SessionService, useValue: sessionService }],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get avatar assignments from session service', () => {
        const assignments = component.assignments;
        expect(assignments).toBe(mockAssignments);
        expect(sessionService.avatarAssignments).toHaveBeenCalled();
    });
});
