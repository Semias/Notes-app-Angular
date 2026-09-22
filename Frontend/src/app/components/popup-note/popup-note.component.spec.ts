import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PopupNoteComponent } from './popup-note.component';

describe('PopupNoteComponent', () => {
  let component: PopupNoteComponent;
  let fixture: ComponentFixture<PopupNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupNoteComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add and remove tags', () => {
    component.tags = [{ name: 'work' }];
    component.remove(component.tags[0]);
    expect(component.tags.length).toBe(0);
  });

  it('should emit a new note on submit and reset the form', () => {
    const spy = spyOn(component.onAddNote, 'emit');
    component.title = 'A note';
    component.content = 'Some content';
    component.tags = [{ name: 'work' }];

    component.onSubmit();

    expect(spy).toHaveBeenCalledWith({
      title: 'A note',
      tags: ['work'],
      content: 'Some content',
    });
    expect(component.title).toBe('');
    expect(component.tags).toEqual([]);
  });
});
