import { Note } from "./Note";
import { Component } from "@angular/core";

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
}
