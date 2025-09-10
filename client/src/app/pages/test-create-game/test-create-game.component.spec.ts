import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestCreateGameComponent } from './test-create-game.component';

describe('TestCreateGameComponent', () => {
  let component: TestCreateGameComponent;
  let fixture: ComponentFixture<TestCreateGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCreateGameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestCreateGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
