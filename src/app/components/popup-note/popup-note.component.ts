import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { Note } from "src/app/Note";

export interface Tag {
	name: string;
}

@Component({
	selector: "app-popup-note",
	templateUrl: "./popup-note.component.html",
	styleUrls: ["./popup-note.component.scss"],
})
export class PopupNoteComponent implements OnInit {
	addOnBlur = true;
	readonly separatorKeysCodes = [ENTER, COMMA] as const;
	tags: Tag[] = [];

	ngViewAfterInit() {}

	constructor() {}

	ngOnInit(): void {}

	add(event: MatChipInputEvent): void {
		const value = (event.value || "").trim();

		// Add our fruit
		if (value) {
			this.tags.push({ name: value });
		}

		// Clear the input value
		event.chipInput!.clear();
	}

	remove(fruit: Tag): void {
		const index = this.tags.indexOf(fruit);

		if (index >= 0) {
			this.tags.splice(index, 1);
		}
	}

	edit(tag: Tag, event: MatChipEditedEvent) {
		const value = event.value.trim();

		// Remove fruit if it no longer has a name
		if (!value) {
			this.remove(tag);
			return;
		}

		// Edit existing fruit
		const index = this.tags.indexOf(tag);
		if (index >= 0) {
			this.tags[index].name = value;
		}
	}

	@Input() isPopUpOpen: boolean | undefined;
	@Output() close = new EventEmitter<boolean>();
	@Output() onAddNote: EventEmitter<Note> = new EventEmitter();

	closePopup() {
		this.close.emit((this.isPopUpOpen = false));
	}

	title!: string;
	// noteTags: string[] | undefined;
	content!: string;

	onSubmit() {
		if (!this.title) {
			alert("Please add note!");
			return;
		}

		const newNote = {
			title: this.title,
			tags: this.tags,
			content: this.content,
		};

		this.onAddNote.emit(newNote);

		this.title = "";
		this.tags = [];
		this.content = "";
	}
}
