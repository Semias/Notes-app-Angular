import { Component, Input, Output } from "@angular/core";
import { NoteService } from "src/app/services/note.service";
import { Note } from "./Note";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	selectedNote?: Note | undefined;
	notes: Note[] = [];
	filteredNotes: Note[] = [];
	filterValue: string = "";

	// constructor(private noteService: NoteService) {}

	// ngOnInit() {
	// 	this.noteService.getNotes().subscribe((notes) => (this.notes = notes));
	// }

	// filterNotes(): void {
	// 	if (this.filterValue === "") {
	// 		this.filteredNotes = this.notes;
	// 	} else {
	// 		this.filteredNotes = this.notes.filter((note) => note.title.toLowerCase().includes(this.filterValue.toLowerCase()));
	// 	}
	// 	console.log(this.filteredNotes);
	// }
}
