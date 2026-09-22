import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the "Notes" heading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:5000/notes').flush([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Notes');
  });

  it('should append the created note to the list and close the popup', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:5000/notes').flush([]);
    app.openPopup();

    app.addNote({ title: 'New', tags: ['work'], content: 'c' });

    const created = { id: 7, title: 'New', tags: ['work'], content: 'c' };
    const req = httpMock.expectOne('http://localhost:5000/notes');
    expect(req.request.method).toBe('POST');
    req.flush(created);

    expect(app.noteList.notes).toEqual([created]);
    expect(app.isPopUpOpen).toBeFalse();
  });

  it('should keep the popup open when creating a note fails', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:5000/notes').flush([]);
    app.openPopup();

    app.addNote({ title: 'New', tags: [], content: 'c' });
    httpMock
      .expectOne('http://localhost:5000/notes')
      .error(new ProgressEvent('failed'));

    expect(app.isPopUpOpen).toBeTrue();
    expect(app.noteList.notes).toEqual([]);
  });

  it('should open the popup', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.isPopUpOpen).toBeFalse();
    app.openPopup();
    expect(app.isPopUpOpen).toBeTrue();

    app.receiveClose(false);
    expect(app.isPopUpOpen).toBeFalse();
  });
});
