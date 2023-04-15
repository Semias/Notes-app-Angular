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
  @Input() selectedNote!: Note | undefined;

  @Output() selectNote = new EventEmitter<Note>();
  @Output() unSelectNote = new EventEmitter<Note>();

  constructor(private noteService: NoteService) {}

  ngOnInit(): void {
    this.noteService.getNotes().subscribe((notes) => (this.notes = notes));
  }
}
