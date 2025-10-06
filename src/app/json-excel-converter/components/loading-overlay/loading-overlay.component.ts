import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['../../json-excel-converter.component.css', './loading-overlay.component.css']
})
export class LoadingOverlayComponent {
  @Input() progressMessage = '';
  @Input() progressPercent = 0;
}
