import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NoteListComponent } from './note-list.component';
import { Note } from '../../Note';

describe('NoteListComponent', () => {
  let component: NoteListComponent;
  let fixture: ComponentFixture<NoteListComponent>;
  let httpMock: HttpTestingController;

  const notes: Note[] = [
    { id: 1, title: 'Work note', tags: ['work'], content: 'a' },
    { id: 2, title: 'Sports note', tags: ['sports'], content: 'b' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NoteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:5000/notes').flush(notes);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notes on init', () => {
    expect(component.notes.length).toBe(2);
    expect(component.notesToDisplay.length).toBe(2);
  });

  it('should filter notes by title', () => {
    component.filterValue = 'work';
    component.ngOnChanges();
    expect(component.notesToDisplay).toEqual([notes[0]]);
  });

  it('should toggle the selection when the same note is clicked twice', () => {
    const spy = spyOn(component.selectNote, 'emit');

    component.showDetail(notes[0]);
    expect(component.selectedNote).toBe(notes[0]);
    expect(spy).toHaveBeenCalledWith(notes[0]);

    component.showDetail(notes[0]);
    expect(component.selectedNote).toBeNull();
    expect(spy).toHaveBeenCalledWith(undefined);
  });

  it('should append an added note and keep the filter applied', () => {
    const created: Note = { id: 3, title: 'Work log', tags: [], content: 'c' };

    component.filterValue = 'work';
    component.ngOnChanges();
    component.addNote(created);

    expect(component.notes.length).toBe(3);
    expect(component.notesToDisplay).toEqual([notes[0], created]);
  });

  it('should remove a deleted note from the list', () => {
    component.deleteNote(notes[0]);
    httpMock.expectOne('http://localhost:5000/notes/1').flush({});

    expect(component.notes.length).toBe(1);
    expect(component.notes[0].id).toBe(2);
  });
});
