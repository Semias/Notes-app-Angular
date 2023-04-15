import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Note } from '../../Note';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
})
export class NoteComponent implements OnInit {
  @Input() note!: Note;

  constructor() {}

  ngOnInit(): void {}
}
