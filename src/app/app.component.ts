import { Note } from "./Note";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component } from "@angular/core";
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from "@angular/material/chips";

export interface Fruit {
	name: string;
}

/**
 * @title Chips with input
 */
@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	selectedNote?: Note | undefined;
	filterValue: string = "";

	addOnBlur = true;
	readonly separatorKeysCodes = [ENTER, COMMA] as const;
	fruits: Fruit[] = [{ name: "Lemon" }, { name: "Lime" }, { name: "Apple" }];

	add(event: MatChipInputEvent): void {
		const value = (event.value || "").trim();

		// Add our fruit
		if (value) {
			this.fruits.push({ name: value });
		}

		// Clear the input value
		event.chipInput!.clear();
	}

	remove(fruit: Fruit): void {
		const index = this.fruits.indexOf(fruit);

		if (index >= 0) {
			this.fruits.splice(index, 1);
		}
	}

	edit(fruit: Fruit, event: MatChipEditedEvent) {
		const value = event.value.trim();

		// Remove fruit if it no longer has a name
		if (!value) {
			this.remove(fruit);
			return;
		}

		// Edit existing fruit
		const index = this.fruits.indexOf(fruit);
		if (index >= 0) {
			this.fruits[index].name = value;
		}
	}
}
