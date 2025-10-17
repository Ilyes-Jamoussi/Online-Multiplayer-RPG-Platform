import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GameSessionPageComponent } from './game-session-page.component';

describe('GameSessionPageComponent', () => {
    let component: GameSessionPageComponent;
    let fixture: ComponentFixture<GameSessionPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameSessionPageComponent],
            providers: [
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameSessionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
