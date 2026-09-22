import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../app/services/note.service';
import { Note } from './Note';
import { NoteListComponent } from './components/note-list/note-list.component';
import { DetailViewComponent } from './components/detail-view/detail-view.component';
import { PopupNoteComponent } from './components/popup-note/popup-note.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NoteListComponent,
    DetailViewComponent,
    PopupNoteComponent,
  ],
})
export class AppComponent {
  selectedNote?: Note | undefined;
  filterValue: string = '';
  isPopUpOpen: boolean = false;

  @ViewChild(NoteListComponent) noteList!: NoteListComponent;

  constructor(private noteService: NoteService) {}

  openPopup() {
    this.isPopUpOpen = true;
  }

  receiveClose($event: boolean) {
    this.isPopUpOpen = $event;
  }

  addNote(note: Note) {
    this.noteService.addNote(note).subscribe({
      next: (created) => {
        this.noteList.addNote(created);
        this.isPopUpOpen = false;
      },
      // Leave the popup open so the user does not lose what they typed.
      error: (err) => console.error('Could not create note', err),
    });
  }
}
