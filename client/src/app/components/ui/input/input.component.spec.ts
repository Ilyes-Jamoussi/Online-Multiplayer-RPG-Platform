import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiInputComponent } from './input.component';

describe('UiInputComponent', () => {
    let component: UiInputComponent;
    let fixture: ComponentFixture<UiInputComponent>;

    const getControl = <T extends HTMLInputElement | HTMLTextAreaElement>() => fixture.nativeElement.querySelector('input, textarea') as T;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UiInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UiInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should have default values', () => {
            expect(component.placeholder).toBe('');
            expect(component.type).toBe('text');
            expect(component.value).toBe('');
            expect(component.maxLength).toBeUndefined();
        });

        it('should render input element', () => {
            const el = getControl();
            expect(el).toBeTruthy();
            expect(el.tagName.toLowerCase()).toBe('input');
        });
    });

    describe('Input Properties', () => {
        it('should set placeholder', () => {
            component.placeholder = 'Test placeholder';
            fixture.detectChanges();

            const el = getControl<HTMLInputElement>();
            expect(el.placeholder).toBe('Test placeholder');
        });

        it('should set maxLength', () => {
            const maxLength = 10;
            component.maxLength = maxLength;
            fixture.detectChanges();

            const el = getControl<HTMLInputElement>();
            expect(el.maxLength).toBe(maxLength);
        });

        it('should set value', () => {
            component.value = 'test value';
            fixture.detectChanges();

            const el = getControl<HTMLInputElement>();
            expect(component.value).toBe('test value');
            expect(el.value).toBe('test value');
        });

        it('should handle undefined value', () => {
            component.value = undefined as unknown as string;
            expect(component.value).toBe('');
        });
    });

    describe('Value Changes', () => {
        it('should emit valueChange on input', () => {
            spyOn(component.valueChange, 'emit');

            const el = getControl<HTMLInputElement>();
            el.value = 'test';
            el.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(component.valueChange.emit).toHaveBeenCalledWith('test');
            expect(component.value).toBe('test');
        });

        it('should handle space-dot replacement', () => {
            spyOn(component.valueChange, 'emit');

            const el = getControl<HTMLInputElement>();
            el.value = 'test. ';
            el.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(component.value).toBe('test ');
            expect(component.valueChange.emit).toHaveBeenCalledWith('test ');
        });

        it('should filter invalid characters on input for text type', () => {
            component.type = 'text';
            fixture.detectChanges();

            spyOn(component.valueChange, 'emit');
            const el = getControl<HTMLInputElement>();
            el.value = 'test123!@#';
            el.dispatchEvent(new Event('input'));

            expect(component.value).toBe('test');
            expect(component.valueChange.emit).toHaveBeenCalledWith('test');
        });

        it('should filter invalid characters on input for number type', () => {
            component.type = 'number';
            fixture.detectChanges();

            spyOn(component.valueChange, 'emit');
            const el = getControl<HTMLInputElement>();
            el.value = '123abc456';
            el.dispatchEvent(new Event('input'));

            expect(component.value).toBe('123456');
            expect(component.valueChange.emit).toHaveBeenCalledWith('123456');
        });
    });

    describe('Text Input Validation', () => {
        beforeEach(() => {
            component.type = 'text';
            fixture.detectChanges();
        });

        it('should allow valid text characters', () => {
            const validChars = ['a', 'A', 'é', 'À', '-', "'"];

            validChars.forEach((char) => {
                const mockInput = { selectionStart: 1, selectionEnd: 1, value: 'test' } as HTMLInputElement;
                const event = new KeyboardEvent('keydown', { key: char });
                Object.defineProperty(event, 'target', { value: mockInput });
                spyOn(event, 'preventDefault');

                component.onKeyDown(event);

                expect(event.preventDefault).not.toHaveBeenCalled();
            });
        });

        it('should prevent invalid text characters', () => {
            const invalidChars = ['1', '!', '@', '#'];

            invalidChars.forEach((char) => {
                const mockInput = { selectionStart: 1, selectionEnd: 1, value: 'test' } as HTMLInputElement;
                const event = new KeyboardEvent('keydown', { key: char });
                Object.defineProperty(event, 'target', { value: mockInput });
                spyOn(event, 'preventDefault');

                component.onKeyDown(event);

                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        it('should prevent space at beginning', () => {
            const mockInput = { selectionStart: 0, selectionEnd: 0, value: '' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should prevent consecutive spaces', () => {
            const mockInput = { selectionStart: 5, selectionEnd: 5, value: 'test ' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should allow space in middle of text', () => {
            const mockInput = { selectionStart: 2, selectionEnd: 2, value: 'test' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('Number Input Validation', () => {
        beforeEach(() => {
            component.type = 'number';
            fixture.detectChanges();
        });

        it('should allow valid number characters', () => {
            const validChars = ['0', '1', '2', '9'];

            validChars.forEach((char) => {
                const mockInput = { selectionStart: 1, selectionEnd: 1, value: '123' } as HTMLInputElement;
                const event = new KeyboardEvent('keydown', { key: char });
                Object.defineProperty(event, 'target', { value: mockInput });
                spyOn(event, 'preventDefault');

                component.onKeyDown(event);

                expect(event.preventDefault).not.toHaveBeenCalled();
            });
        });

        it('should prevent invalid number characters', () => {
            const invalidChars = ['a', 'A', '-', "'", '!'];

            invalidChars.forEach((char) => {
                const mockInput = { selectionStart: 1, selectionEnd: 1, value: '123' } as HTMLInputElement;
                const event = new KeyboardEvent('keydown', { key: char });
                Object.defineProperty(event, 'target', { value: mockInput });
                spyOn(event, 'preventDefault');

                component.onKeyDown(event);

                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        it('should prevent spaces in number input', () => {
            const mockInput = { selectionStart: 1, selectionEnd: 1, value: '123' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    describe('Special Key Handling', () => {
        it('should allow control keys', () => {
            const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

            controlKeys.forEach((key) => {
                const mockInput = { selectionStart: 1, selectionEnd: 1, value: 'test' } as HTMLInputElement;
                const event = new KeyboardEvent('keydown', { key });
                Object.defineProperty(event, 'target', { value: mockInput });
                spyOn(event, 'preventDefault');

                component.onKeyDown(event);

                expect(event.preventDefault).not.toHaveBeenCalled();
            });
        });

        it('should handle text selection with space', () => {
            const mockInput = { selectionStart: 1, selectionEnd: 3, value: 'test' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should prevent space when selection starts at beginning', () => {
            const mockInput = { selectionStart: 0, selectionEnd: 2, value: 'test' } as HTMLInputElement;
            const event = new KeyboardEvent('keydown', { key: ' ' });
            Object.defineProperty(event, 'target', { value: mockInput });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    describe('Selection defaults (selectionStart ?? 0 / selectionEnd ?? 0)', () => {
        it('uses 0 when selectionStart is undefined (property missing) and prevents space because selection starts at 0 with a selection', () => {
            component.type = 'text';
            const fakeEvent = {
                key: ' ',
                target: {
                    value: 'abc',
                    selectionEnd: 1,
                } as unknown as HTMLInputElement,
                preventDefault: jasmine.createSpy(),
            } as unknown as KeyboardEvent;

            component.onKeyDown(fakeEvent);
            expect(fakeEvent.preventDefault).toHaveBeenCalled();
        });

        it('uses 0 when selectionStart is null and prevents space for selection starting at 0', () => {
            component.type = 'text';

            const fakeEvent = {
                key: ' ',
                target: {
                    value: 'hello',
                    selectionStart: null,
                    selectionEnd: 2,
                } as unknown as HTMLInputElement,
                preventDefault: jasmine.createSpy(),
            } as unknown as KeyboardEvent;

            component.onKeyDown(fakeEvent);
            expect(fakeEvent.preventDefault).toHaveBeenCalled();
        });

        it('does NOT fallback when selectionStart is defined (no prevent when selection starts not at 0)', () => {
            component.type = 'text';

            const fakeEvent = {
                key: ' ',
                target: {
                    value: 'abcdef',
                    selectionStart: 2,
                    selectionEnd: 4,
                } as unknown as HTMLInputElement,
                preventDefault: jasmine.createSpy(),
            } as unknown as KeyboardEvent;

            component.onKeyDown(fakeEvent);
            expect(fakeEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('falls back both selectionStart and selectionEnd to 0 when both are undefined (no selection)', () => {
            component.type = 'text';

            const fakeEvent = {
                key: ' ',
                target: {
                    value: '',
                } as unknown as HTMLInputElement,
                preventDefault: jasmine.createSpy(),
            } as unknown as KeyboardEvent;

            component.onKeyDown(fakeEvent);
            expect(fakeEvent.preventDefault).toHaveBeenCalled();
        });
    });
});
