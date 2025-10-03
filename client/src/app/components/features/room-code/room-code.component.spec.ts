import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SessionService } from '@app/services/session/session.service';
import { RoomCodeComponent } from './room-code.component';

describe('RoomCodeComponent', () => {
    let component: RoomCodeComponent;
    let fixture: ComponentFixture<RoomCodeComponent>;
    let sessionService: jasmine.SpyObj<SessionService>;

    beforeEach(async () => {
        sessionService = jasmine.createSpyObj('SessionService', ['id']);
        sessionService.id.and.returnValue('TEST123');

        await TestBed.configureTestingModule({
            imports: [RoomCodeComponent],
            providers: [{ provide: SessionService, useValue: sessionService }],
        }).compileComponents();

        fixture = TestBed.createComponent(RoomCodeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get room code from session service', () => {
        expect(component.roomCode).toBe('TEST123');
        expect(sessionService.id).toHaveBeenCalled();
    });

    describe('copyToClipboard', () => {
        let clipboardWriteTextSpy: jasmine.Spy;

        beforeEach(() => {
            clipboardWriteTextSpy = spyOn(navigator.clipboard, 'writeText');
        });

        it('should copy room code to clipboard', () => {
            component.copyToClipboard();
            expect(clipboardWriteTextSpy).toHaveBeenCalledWith('TEST123');
        });

        it('should show tooltip when copying', () => {
            component.copyToClipboard();
            expect(component.showCopiedTooltip).toBeTrue();
        });

        it('should hide tooltip after delay', fakeAsync(() => {
            component.copyToClipboard();
            expect(component.showCopiedTooltip).toBeTrue();

            tick(2000);
            expect(component.showCopiedTooltip).toBeFalse();
        }));
    });
});
