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
	filterValue: string = "";
}
