import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification/notification.service';
import { of } from 'rxjs';

import { CharacterCreationPageComponent } from './character-creation-page.component';

describe('CharacterCreationPageComponent', () => {
    let component: CharacterCreationPageComponent;
    let fixture: ComponentFixture<CharacterCreationPageComponent>;

    const mockActivatedRoute = {
        queryParams: of({ gameId: 'test-game-id' })
    };

    const mockRouter = {
        navigate: jasmine.createSpy('navigate')
    };

    const mockNotificationService = {
        displayError: jasmine.createSpy('displayError'),
        displaySuccess: jasmine.createSpy('displaySuccess')
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterCreationPageComponent],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: Router, useValue: mockRouter },
                { provide: NotificationService, useValue: mockNotificationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
