import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import * as XLSX from 'xlsx';
import { MonacoEditorComponent } from '../../../shared/monaco-editor/monaco-editor.component';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';
import { ToastContainerComponent } from '../toast-container/toast-container.component';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

@Component({
  selector: 'app-json-to-excel-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, LoadingOverlayComponent, ToastContainerComponent],
  templateUrl: './json-to-excel-panel.component.html',
  styleUrls: ['../../json-excel-converter.component.css', './json-to-excel-panel.component.css']
})
export class JsonToExcelPanelComponent {
  @Output() openGuide = new EventEmitter<void>();
  
  jsonInput = '';
  readonly placeholderJson = `[
  {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com"
  },
  {
    "name": "Jane Smith",
    "age": 25,
    "email": "jane@example.com"
  }
]`;

  private readonly sampleData = [
    {
      id: 1,
      name: 'John Doe',
      age: 30,
      email: 'john.doe@example.com',
      department: 'Engineering',
      salary: 75000,
      startDate: '2022-01-15',
      isActive: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 28,
      email: 'jane.smith@example.com',
      department: 'Marketing',
      salary: 65000,
      startDate: '2021-08-20',
      isActive: true
    },
    {
      id: 3,
      name: 'Mike Johnson',
      age: 35,
      email: 'mike.johnson@example.com',
      department: 'Sales',
      salary: 70000,
      startDate: '2020-03-10',
      isActive: false
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      age: 32,
      email: 'sarah.wilson@example.com',
      department: 'HR',
      salary: 68000,
      startDate: '2021-11-05',
      isActive: true
    },
    {
      id: 5,
      name: 'David Brown',
      age: 29,
      email: 'david.brown@example.com',
      department: 'Engineering',
      salary: 72000,
      startDate: '2022-06-12',
      isActive: true
    }
  ];

  showPreview = false;
  showFireworks = false;
  isProcessing = false;
  progressMessage = '';
  progressPercent = 0;

  private previewData: any[] | null = null;
  toasts: Toast[] = [];

  loadSampleData(): void {
    this.jsonInput = JSON.stringify(this.sampleData, null, 2);
    this.clearMessages();
    this.showSuccess('Sample data loaded successfully!');
  }

  openGuideModal(): void {
    this.openGuide.emit();
  }

  clearJson(): void {
    this.jsonInput = '';
    this.previewData = null;
    this.showPreview = false;
    this.clearMessages();
  }

  onJsonEditorChange(value: string): void {
    this.jsonInput = value;
  }

  async previewExcel(): Promise<void> {
    this.clearMessages();

    if (!this.jsonInput.trim()) {
      this.showError('Please enter JSON data');
      return;
    }

    try {
      const data = JSON.parse(this.jsonInput);

      if (!Array.isArray(data) || data.length === 0) {
        this.showError('Please provide a valid JSON array with at least one object');
        return;
      }

      this.isProcessing = true;
      this.progressPercent = 0;
      await this.simulateProcessing();

      this.previewData = data;
      this.showPreview = true;
      this.showFireworks = true;
      setTimeout(() => {
        this.showFireworks = false;
      }, 1200);
      this.showSuccess('Excel preview generated successfully!');
    } catch (error) {
      this.showError('Invalid JSON format. Please check your input.');
    } finally {
      this.isProcessing = false;
      this.progressMessage = '';
      this.progressPercent = 0;
    }
  }

  private async simulateProcessing(): Promise<void> {
    const steps = [
      { message: 'Parsing JSON data...', duration: 800 },
      { message: 'Validating data structure...', duration: 600 },
      { message: 'Converting to Excel format...', duration: 900 },
      { message: 'Generating preview...', duration: 700 }
    ];

    let totalProgress = 0;
    const stepProgress = 100 / steps.length;

    for (const step of steps) {
      this.progressMessage = step.message;
      const startProgress = totalProgress;
      const endProgress = totalProgress + stepProgress;
      const animationSteps = 20;
      const progressIncrement = stepProgress / animationSteps;
      const timeIncrement = step.duration / animationSteps;

      for (let i = 0; i < animationSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, timeIncrement));
        this.progressPercent = Math.min(startProgress + progressIncrement * (i + 1), endProgress);
      }

      totalProgress = endProgress;
    }

    this.progressPercent = 100;
  }

  downloadExcel(): void {
    if (!this.previewData) {
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(this.previewData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, 'data.xlsx');
      this.showSuccess('Excel file downloaded successfully!');
    } catch (error) {
      this.showError('Error downloading Excel file');
    }
  }

  downloadCsv(): void {
    if (!this.previewData) {
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(this.previewData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'data.csv';
      anchor.click();
      window.URL.revokeObjectURL(url);
      this.showSuccess('CSV file downloaded successfully!');
    } catch (error) {
      this.showError('Error downloading CSV file');
    }
  }

  backToInput(): void {
    this.showPreview = false;
    this.previewData = null;
    this.clearMessages();
  }

  get previewTableHeaders(): string[] {
    if (!this.previewData || this.previewData.length === 0) {
      return [];
    }

    return Object.keys(this.previewData[0]);
  }

  get previewTableRows(): any[] {
    return this.previewData ?? [];
  }

  private showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  private clearMessages(): void {
    this.toasts = [];
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = Date.now();
    const newToast: Toast = { id, message, type, isVisible: true };

    this.toasts = [...this.toasts, newToast];

    setTimeout(() => {
      this.hideToast(id);
    }, 4000);
  }

  dismissToast(id: number): void {
    this.hideToast(id);
  }

  private hideToast(id: number): void {
    this.toasts = this.toasts.map(toast =>
      toast.id === id ? { ...toast, isVisible: false } : toast
    );

    setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
    }, 300);
  }
}


