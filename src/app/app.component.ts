import { Note } from "./Note";
import { Component, Input } from "@angular/core";

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

	isPopUpOpen: boolean = false;

	openPopup() {
		this.isPopUpOpen = true;
	}

	receiveClose($event: boolean) {
		this.isPopUpOpen = $event;
	}
}
