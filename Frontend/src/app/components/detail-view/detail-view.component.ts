import { Component, Input } from '@angular/core';
import { Note } from '../../Note';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
  standalone: true,
  imports: [MatChipsModule],
})
export class DetailViewComponent {
  @Input() selectedNoteDetails!: Note | undefined;
}
