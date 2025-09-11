import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialIcon } from '@ui/types/ui.types';
import { UiIconComponent } from './icon.component';

describe('UiIconComponent', () => {
  let component: UiIconComponent;
  let fixture: ComponentFixture<UiIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default icon name', () => {
    expect(component.iconName).toBe('Home');
  });

  it('should return correct icon value for default', () => {
    expect(component.iconValue).toBe(MaterialIcon.Home);
  });

  it('should return correct icon value for custom icon', () => {
    component.iconName = 'Add';
    expect(component.iconValue).toBe(MaterialIcon.Add);
  });

  it('should generate correct classes', () => {
    const classes = component.classes;
    expect(classes.uiIcon).toBe(true);
    expect(classes['v-primary']).toBe(true);
    expect(classes['s-md']).toBe(true);
  });

  it('should generate correct classes with custom variant and size', () => {
    component.variant = 'secondary';
    component.size = 'lg';
    const classes = component.classes;
    expect(classes.uiIcon).toBe(true);
    expect(classes['v-secondary']).toBe(true);
    expect(classes['s-lg']).toBe(true);
  });

  it('should update icon value when icon name changes', () => {
    component.iconName = 'Delete';
    expect(component.iconValue).toBe(MaterialIcon.Delete);

    component.iconName = 'Edit';
    expect(component.iconValue).toBe(MaterialIcon.Edit);
  });
});
