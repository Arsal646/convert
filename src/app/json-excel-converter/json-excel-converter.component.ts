import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ConversionMode } from './models/conversion-mode';
import { ConverterHeaderComponent } from './components/converter-header/converter-header.component';
import { JsonToExcelPanelComponent } from './components/json-to-excel-panel/json-to-excel-panel.component';
import { ExcelToJsonPanelComponent } from './components/excel-to-json-panel/excel-to-json-panel.component';

import { GuideModalComponent } from './components/guide-modal/guide-modal.component';

@Component({
  selector: 'app-json-excel-converter',
  standalone: true,
  imports: [CommonModule, ConverterHeaderComponent, JsonToExcelPanelComponent, ExcelToJsonPanelComponent, GuideModalComponent],
  templateUrl: './json-excel-converter.component.html',
  styleUrls: ['./json-excel-converter.component.css']
})
export class JsonExcelConverterComponent {
  currentMode = signal<ConversionMode>('jsonToExcel');
  isGuideModalOpen = signal<boolean>(false);
  guideModalMode = signal<ConversionMode>('jsonToExcel');

  switchMode(mode: ConversionMode): void {
    this.currentMode.set(mode);
  }

  openGuide(mode: ConversionMode): void {
    this.guideModalMode.set(mode);
    this.isGuideModalOpen.set(true);
  }

  closeGuideModal(): void {
    this.isGuideModalOpen.set(false);
  }
}



