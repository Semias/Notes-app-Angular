import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { NoteService } from '../../services/note.service';
import { Note } from '../../Note';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss'],
})
export class NoteListComponent implements OnInit {
  notes: Note[] = [];
  selectedNote: Note | null = null;
  @Output() selectNote = new EventEmitter<Note>();

  showDetail(note: Note) {
    if (this.selectedNote === note) {
      this.selectedNote = null;
      this.selectNote.emit();
    } else {
      this.selectedNote = note;
      this.selectNote.emit(note);
    }
  }

  constructor(private noteService: NoteService) {}

  ngOnInit(): void {
    this.noteService.getNotes().subscribe((notes) => (this.notes = notes));
  }
}
