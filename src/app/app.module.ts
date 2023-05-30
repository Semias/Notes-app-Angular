import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { DetailViewComponent } from "./components/detail-view/detail-view.component";
import { NoteListComponent } from "./components/note-list/note-list.component";
import { NoteComponent } from "./components/note/note.component";
import { FormsModule } from "@angular/forms";

import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { NgFor } from "@angular/common";

@NgModule({
	declarations: [AppComponent, DetailViewComponent, NoteListComponent, NoteComponent],
	imports: [BrowserModule, HttpClientModule, FormsModule, MatFormFieldModule, MatChipsModule, NgFor, MatIconModule, FormsModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
