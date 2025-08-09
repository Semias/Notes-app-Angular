import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Note } from '../../Note';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  standalone: false,
})
export class NoteComponent implements OnInit {
  @Input() note!: Note;
  @Output() onDeleteNote: EventEmitter<Note> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  deleteNote(note: Note) {
    this.onDeleteNote.emit(note);
  }
}
