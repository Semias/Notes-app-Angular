import { Component, Input } from '@angular/core';
import { Note } from './Note';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  selectedNote?: Note | undefined;
}
