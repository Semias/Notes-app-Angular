import { Component, EventEmitter, Input, Output } from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from "@angular/material/chips";

export interface Tag {
	name: string;
}

@Component({
	selector: "app-popup-note",
	templateUrl: "./popup-note.component.html",
	styleUrls: ["./popup-note.component.scss"],
})
export class PopupNoteComponent {
	addOnBlur = true;
	readonly separatorKeysCodes = [ENTER, COMMA] as const;
	tags: Tag[] = [{ name: "Lemon" }, { name: "Lime" }, { name: "Apple" }];

	ngViewAfterInit() {}

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

	closePopup() {
		this.close.emit((this.isPopUpOpen = false));
	}
}
