import { Component, Input } from '@angular/core';
import { NoteService } from '../app/services/note.service';
import { Note } from './Note';

/**
 * @title Chips with input
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  notes: Note[] = [];
  selectedNote?: Note | undefined;
  filterValue: string = '';

  isPopUpOpen: boolean = false;

  constructor(private noteService: NoteService) {}

  openPopup() {
    this.isPopUpOpen = true;
  }

  receiveClose($event: boolean) {
    this.isPopUpOpen = $event;
  }

  addNote(note: Note) {
    this.noteService.addNote(note).subscribe((note) => this.notes.push(note));
    // console.log(note);
  }
}
