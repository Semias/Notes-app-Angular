import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { NoteService } from './note.service';
import { Note } from '../Note';

describe('NoteService', () => {
  let service: NoteService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:5000/notes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(NoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch notes', () => {
    const notes: Note[] = [
      { id: 1, title: 'A note', tags: [], content: 'a' },
    ];

    service.getNotes().subscribe((result) => expect(result).toEqual(notes));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(notes);
  });

  it('should post a new note', () => {
    const note: Note = { title: 'New', tags: ['x'], content: 'c' };

    service.addNote(note).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(note);
    req.flush({ ...note, id: 9 });
  });

  it('should delete a note by id', () => {
    service.deleteNote({ id: 4, title: 'x', tags: [], content: '' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
