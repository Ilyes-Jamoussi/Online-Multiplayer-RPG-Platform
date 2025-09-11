import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameParametersPageComponent } from './game-parameters-page.component';

describe('GameParametersPageComponent', () => {
  let component: GameParametersPageComponent;
  let fixture: ComponentFixture<GameParametersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameParametersPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameParametersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
