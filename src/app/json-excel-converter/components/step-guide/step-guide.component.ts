import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConversionMode } from '../../models/conversion-mode';

@Component({
  selector: 'app-step-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-guide.component.html',
  styleUrls: ['../../json-excel-converter.component.css', './step-guide.component.css']
})
export class StepGuideComponent {
  @Input() activeTab: ConversionMode = 'jsonToExcel';
  @Output() tabChange = new EventEmitter<ConversionMode>();

  switchTab(tab: ConversionMode): void {
    if (this.activeTab !== tab) {
      this.tabChange.emit(tab);
    }
  }
}
