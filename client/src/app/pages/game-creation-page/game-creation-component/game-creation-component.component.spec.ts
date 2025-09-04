import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCreationComponentComponent } from './game-creation-component.component';

describe('GameCreationComponentComponent', () => {
  let component: GameCreationComponentComponent;
  let fixture: ComponentFixture<GameCreationComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCreationComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameCreationComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
