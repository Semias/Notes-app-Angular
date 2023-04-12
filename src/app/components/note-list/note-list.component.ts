import { Component, OnInit } from '@angular/core';
import { Note } from '../../Note';
import { NOTES } from '../../mock-notes';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss'],
})
export class NoteListComponent implements OnInit {
  notes: Note[] = NOTES;

  ngOnInit(): void {}
}
