import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionService } from '@app/services/session/session.service';
import { PlayerService } from '@app/services/player/player.service';
import { GameMapService } from '@app/services/game-map/game-map.service';

import { GameSessionPageComponent } from './game-session-page.component';

describe('GameSessionPageComponent', () => {
  let component: GameSessionPageComponent;
  let fixture: ComponentFixture<GameSessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSessionPageComponent],
      providers: [
        provideHttpClient(),
        SessionService,
        PlayerService,
        GameMapService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameSessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
