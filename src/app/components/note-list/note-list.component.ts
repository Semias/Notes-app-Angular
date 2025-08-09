import { Component, EventEmitter, OnInit, Output, Input, OnChanges } from "@angular/core";
import { NoteService } from "../../services/note.service";
import { Note } from "../../Note";

@Component({
    selector: "app-note-list",
    templateUrl: "./note-list.component.html",
    styleUrls: ["./note-list.component.scss"],
    standalone: false
})
export class NoteListComponent implements OnInit, OnChanges {
	notes: Note[] = [];
	filteredNotes: Note[] = [];
	selectedNote: Note | null = null;
	@Output() selectNote = new EventEmitter<Note>();
	@Input() filterValue: string = "";

	get notesToDisplay(): Note[] {
		return this.filterValue === "" ? this.notes : this.filteredNotes;
	}

	ngOnChanges(): void {
		this.filterNotes();
	}

	filterNotes(): void {
		this.filteredNotes = this.notes.filter((note) => note.title.toLowerCase().includes(this.filterValue.toLowerCase()));
	}

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

	deleteNote(note: Note) {
		this.noteService.deleteNote(note).subscribe(() => (this.notes = this.notes.filter((n) => n.id !== note.id)));
	}
}
