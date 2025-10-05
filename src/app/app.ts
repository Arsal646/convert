import { Component, signal } from '@angular/core';
import { JsonExcelConverterComponent } from './json-excel-converter/json-excel-converter.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, JsonExcelConverterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('convertor');
  currentView = signal<'converter' | 'guide'>('converter');

  showConverter(): void {
    this.currentView.set('converter');
  }

  showGuide(): void {
    this.currentView.set('guide');
  }
}
