import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Note } from '../../Note';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatChipsModule],
})
export class NoteComponent {
  @Input() note!: Note;
  @Output() onDeleteNote: EventEmitter<Note> = new EventEmitter();

  deleteNote(note: Note) {
    this.onDeleteNote.emit(note);
  }
}
