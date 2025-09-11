import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCardTitleComponent, UiCardContentComponent, UiCardFooterComponent } from './card-sections.component';

describe('Card Sections Components', () => {
  describe('UiCardTitleComponent', () => {
    let component: UiCardTitleComponent;
    let fixture: ComponentFixture<UiCardTitleComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UiCardTitleComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(UiCardTitleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default values', () => {
      expect(component.alignText).toBe('left');
      expect(component.iconRight).toBe(false);
    });

    it('should generate correct classes with defaults', () => {
      const classes = component.classes;
      expect(classes['icon-right']).toBe(false);
      expect(classes['al-left']).toBe(true);
      expect(classes['v-primary']).toBe(true);
    });

    it('should generate correct classes with custom values', () => {
      component.alignText = 'center';
      component.iconRight = true;
      const classes = component.classes;
      expect(classes['icon-right']).toBe(true);
      expect(classes['al-center']).toBe(true);
    });
  });

  describe('UiCardContentComponent', () => {
    let component: UiCardContentComponent;
    let fixture: ComponentFixture<UiCardContentComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UiCardContentComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(UiCardContentComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default alignContent', () => {
      expect(component.alignContent).toBe('left');
    });

    it('should generate correct classes', () => {
      component.alignContent = 'right';
      const classes = component.classes;
      expect(classes['al-right']).toBe(true);
    });
  });

  describe('UiCardFooterComponent', () => {
    let component: UiCardFooterComponent;
    let fixture: ComponentFixture<UiCardFooterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [UiCardFooterComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(UiCardFooterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default alignText', () => {
      expect(component.alignText).toBe('left');
    });

    it('should generate correct classes', () => {
      component.alignText = 'center';
      const classes = component.classes;
      expect(classes['al-center']).toBe(true);
    });
  });
});
