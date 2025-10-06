import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConversionMode } from '../../models/conversion-mode';

@Component({
  selector: 'app-converter-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './converter-header.component.html',
  styleUrls: ['./converter-header.component.css']
})
export class ConverterHeaderComponent {
  @Input() mode: ConversionMode = 'jsonToExcel';
  @Output() modeChange = new EventEmitter<ConversionMode>();

  onSwitch(mode: ConversionMode): void {
    if (this.mode !== mode) {
      this.modeChange.emit(mode);
    }
  }
}

