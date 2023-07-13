import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupNoteComponent } from './popup-note.component';

describe('PopupNoteComponent', () => {
  let component: PopupNoteComponent;
  let fixture: ComponentFixture<PopupNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PopupNoteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
