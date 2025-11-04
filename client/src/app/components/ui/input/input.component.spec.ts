import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiInputComponent } from './input.component';
import { InputVariants } from '@app/enums/input-variants.enum';

describe('UiInputComponent', () => {
    let component: UiInputComponent;
    let fixture: ComponentFixture<UiInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiInputComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set and get value correctly', () => {
        component.value = 'test value';
        expect(component.value).toBe('test value');
    });

    it('should return true for isFullWidth when fullWidth is true', () => {
        component.fullWidth = true;
        expect(component.isFullWidth).toBe(true);
    });

    it('should return false for isFullWidth when fullWidth is false', () => {
        component.fullWidth = false;
        expect(component.isFullWidth).toBe(false);
    });

    it('should prevent space at beginning of input', () => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        const input = document.createElement('input');
        input.value = '';
        input.selectionStart = 0;
        input.selectionEnd = 0;
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space after existing space', () => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        const input = document.createElement('input');
        input.value = 'test ';
        input.selectionStart = 5;
        input.selectionEnd = 5;
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space in middle of text', () => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        const input = document.createElement('input');
        input.value = 'test';
        input.selectionStart = 2;
        input.selectionEnd = 2;
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent invalid characters for text input', () => {
        component.type = InputVariants.TEXT;
        const event = new KeyboardEvent('keydown', { key: '1' });
        const input = document.createElement('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow valid characters for text input', () => {
        component.type = InputVariants.TEXT;
        const event = new KeyboardEvent('keydown', { key: 'a' });
        const input = document.createElement('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow numbers for number input', () => {
        component.type = InputVariants.NUMBER;
        const event = new KeyboardEvent('keydown', { key: '5' });
        const input = document.createElement('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent letters for number input', () => {
        component.type = InputVariants.NUMBER;
        const event = new KeyboardEvent('keydown', { key: 'a' });
        const input = document.createElement('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not prevent special keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'Backspace' });
        const input = document.createElement('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle ". " replacement in onInput', () => {
        const input = document.createElement('input');
        input.value = 'test. ';
        const event = new Event('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(component.valueChange, 'emit');

        component.onInput(event);

        expect(input.value).toBe('test ');
        expect(component.value).toBe('test ');
        expect(component.valueChange.emit).toHaveBeenCalledWith('test ');
    });

    it('should filter invalid characters in onInput', () => {
        component.type = InputVariants.TEXT;
        const input = document.createElement('input');
        input.value = 'test123';
        const event = new Event('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(component.valueChange, 'emit');

        component.onInput(event);

        expect(component.value).toBe('test');
        expect(component.valueChange.emit).toHaveBeenCalledWith('test');
    });

    it('should preserve spaces when filtering invalid characters', () => {
        component.type = InputVariants.TEXT;
        const input = document.createElement('input');
        input.value = 'test 123 abc';
        const event = new Event('input');
        Object.defineProperty(event, 'target', { value: input });
        spyOn(component.valueChange, 'emit');

        component.onInput(event);

        expect(component.value).toBe('test  abc');
        expect(component.valueChange.emit).toHaveBeenCalledWith('test  abc');
    });

    it('should allow space when text is selected at beginning', () => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        const input = document.createElement('input');
        input.value = 'test';
        input.selectionStart = 0;
        input.selectionEnd = 2;
        Object.defineProperty(event, 'target', { value: input });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle textarea input', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        const textarea = document.createElement('textarea');
        textarea.value = 'test';
        textarea.selectionStart = 2;
        textarea.selectionEnd = 2;
        Object.defineProperty(event, 'target', { value: textarea });
        spyOn(event, 'preventDefault');

        component.onKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });
});