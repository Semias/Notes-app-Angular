import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AppComponent } from './app.component';
import { DetailViewComponent } from './components/detail-view/detail-view.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteComponent } from './components/note/note.component';
import { FormsModule } from '@angular/forms';

import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { NgFor } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { PopupNoteComponent } from './components/popup-note/popup-note.component';

@NgModule({
  declarations: [
    AppComponent,
    DetailViewComponent,
    NoteListComponent,
    NoteComponent,
    PopupNoteComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    MatFormFieldModule,
    MatChipsModule,
    NgFor,
    MatIconModule,
    FormsModule,
    MatInputModule,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}
