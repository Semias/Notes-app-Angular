import { Component, Input, Output } from '@angular/core';
import { Note } from '../../Note';

@Component({
    selector: 'app-detail-view',
    templateUrl: './detail-view.component.html',
    styleUrls: ['./detail-view.component.scss'],
    standalone: false
})
export class DetailViewComponent {
  @Input() selectedNoteDetails!: Note | undefined;
}
