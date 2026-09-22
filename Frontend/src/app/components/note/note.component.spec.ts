import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NoteComponent } from './note.component';
import { Note } from '../../Note';

describe('NoteComponent', () => {
  let component: NoteComponent;
  let fixture: ComponentFixture<NoteComponent>;

  const note: Note = {
    id: 1,
    title: 'A note',
    tags: ['work'],
    content: 'Some content',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteComponent);
    component = fixture.componentInstance;
    component.note = note;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the note when deleted', () => {
    const spy = spyOn(component.onDeleteNote, 'emit');
    component.deleteNote(note);
    expect(spy).toHaveBeenCalledWith(note);
  });
});
