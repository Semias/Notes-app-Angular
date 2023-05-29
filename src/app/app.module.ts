import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { DetailViewComponent } from "./components/detail-view/detail-view.component";
import { NoteListComponent } from "./components/note-list/note-list.component";
import { NoteComponent } from "./components/note/note.component";
import { FormsModule } from "@angular/forms";

@NgModule({
	declarations: [AppComponent, DetailViewComponent, NoteListComponent, NoteComponent],
	imports: [BrowserModule, HttpClientModule, FormsModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
