import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { NoteService } from '../../services/note.service';
import { Note } from '../../Note';
import { NoteComponent } from '../note/note.component';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss'],
  standalone: true,
  imports: [NoteComponent],
})
export class NoteListComponent implements OnInit, OnChanges {
  notes: Note[] = [];
  filteredNotes: Note[] = [];
  selectedNote: Note | null = null;
  @Output() selectNote = new EventEmitter<Note | undefined>();
  @Input() filterValue: string = '';

  constructor(private noteService: NoteService) {}

  get notesToDisplay(): Note[] {
    return this.filterValue === '' ? this.notes : this.filteredNotes;
  }

  ngOnInit(): void {
    this.noteService.getNotes().subscribe((notes) => {
      this.notes = notes;
      this.filterNotes();
    });
  }

  ngOnChanges(): void {
    this.filterNotes();
  }

  filterNotes(): void {
    this.filteredNotes = this.notes.filter((note) =>
      note.title.toLowerCase().includes(this.filterValue.toLowerCase())
    );
  }

  showDetail(note: Note) {
    if (this.selectedNote === note) {
      this.selectedNote = null;
      this.selectNote.emit(undefined);
    } else {
      this.selectedNote = note;
      this.selectNote.emit(note);
    }
  }

  addNote(note: Note) {
    this.notes = [...this.notes, note];
    this.filterNotes();
  }

  deleteNote(note: Note) {
    this.noteService.deleteNote(note).subscribe(() => {
      this.notes = this.notes.filter((n) => n.id !== note.id);
      this.filterNotes();
      if (this.selectedNote?.id === note.id) {
        this.selectedNote = null;
        this.selectNote.emit(undefined);
      }
    });
  }
}
