import { Component, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { FileService } from '../services/file.service';
import { MonacoEditorComponent } from '../shared/monaco-editor/monaco-editor.component';

type ConversionMode = 'jsonToExcel' | 'excelToJson';

interface ExcelData {
  [key: string]: any;
}

@Component({
  selector: 'app-json-excel-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorComponent],
  templateUrl: './json-excel-converter.component.html',
  styleUrls: ['./json-excel-converter.component.css']
})
export class JsonExcelConverterComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private fileService = inject(FileService);

  currentMode = signal<ConversionMode>('jsonToExcel');
  jsonInput = signal<string>('');
  jsonOutput = signal<string>('');
  fileName = signal<string>('');
  isDragOver = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  showPreview = signal<boolean>(false);
  showJsonOutput = signal<boolean>(false);
  fileUploaded = signal<boolean>(false);
  progressMessage = signal<string>('');
  progressPercent = signal<number>(0);
  showFireworks = signal<boolean>(false);
  guideTab = signal<'jsonToExcel' | 'excelToJson'>('jsonToExcel');

  // Toast notifications
  toasts = signal<Array<{ id: number, message: string, type: 'success' | 'error', isVisible: boolean }>>([]);

  // Store uploaded file for later conversion
  private uploadedFile: File | null = null;

  excelData: any[] | null = null;
  private previewData: any[] | null = null;

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

  readonly sampleData = [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30,
      "email": "john.doe@example.com",
      "department": "Engineering",
      "salary": 75000,
      "startDate": "2022-01-15",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "age": 28,
      "email": "jane.smith@example.com",
      "department": "Marketing",
      "salary": 65000,
      "startDate": "2021-08-20",
      "isActive": true
    },
    {
      "id": 3,
      "name": "Mike Johnson",
      "age": 35,
      "email": "mike.johnson@example.com",
      "department": "Sales",
      "salary": 70000,
      "startDate": "2020-03-10",
      "isActive": false
    },
    {
      "id": 4,
      "name": "Sarah Wilson",
      "age": 32,
      "email": "sarah.wilson@example.com",
      "department": "HR",
      "salary": 68000,
      "startDate": "2021-11-05",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    },
    {
      "id": 5,
      "name": "David Brown",
      "age": 29,
      "email": "david.brown@example.com",
      "department": "Engineering",
      "salary": 72000,
      "startDate": "2022-06-12",
      "isActive": true
    }
  ];

  switchMode(mode: ConversionMode): void {
    this.currentMode.set(mode);
    this.showPreview.set(false);
    this.showJsonOutput.set(false);
    this.fileUploaded.set(false);
    this.fileName.set('');
    this.uploadedFile = null;
    this.clearMessages();
  }

  async previewExcel(): Promise<void> {
    this.clearMessages();

    if (!this.jsonInput().trim()) {
      this.showError('Please enter JSON data');
      return;
    }

    try {
      const data = JSON.parse(this.jsonInput());

      if (!Array.isArray(data) || data.length === 0) {
        this.showError('Please provide a valid JSON array with at least one object');
        return;
      }

      this.isProcessing.set(true);
      this.progressPercent.set(0);

      // Simulate processing with progress updates
      await this.simulateProcessing();

      this.previewData = data;
      this.showPreview.set(true);
      this.showSuccess('Excel preview generated successfully!');
    } catch (error) {
      this.showError('Invalid JSON format. Please check your input.');
    } finally {
      this.isProcessing.set(false);
      this.progressMessage.set('');
      this.progressPercent.set(0);
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
      this.progressMessage.set(step.message);

      // Animate progress for this step
      const startProgress = totalProgress;
      const endProgress = totalProgress + stepProgress;
      const animationDuration = step.duration;
      const animationSteps = 20;
      const progressIncrement = stepProgress / animationSteps;
      const timeIncrement = animationDuration / animationSteps;

      for (let i = 0; i < animationSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, timeIncrement));
        this.progressPercent.set(Math.min(startProgress + (progressIncrement * (i + 1)), endProgress));
      }

      totalProgress = endProgress;
    }

    this.progressPercent.set(100);
  }

  downloadExcel(): void {
    if (!this.previewData) return;

    try {
      const ws = XLSX.utils.json_to_sheet(this.previewData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      XLSX.writeFile(wb, 'data.xlsx');
      this.showSuccess('Excel file downloaded successfully!');
    } catch (error) {
      this.showError('Error downloading Excel file');
    }
  }


  downloadCsv(): void {
    if (!this.previewData) return;

    try {
      const ws = XLSX.utils.json_to_sheet(this.previewData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      this.fileService.downloadFile(csv, 'data.csv', 'text/csv;charset=utf-8');
      this.showSuccess('CSV file downloaded successfully!');
    } catch (error) {
      this.showError('Error downloading CSV file');
    }
  }

  backToInput(): void {
    this.showPreview.set(false);
    this.clearMessages();
  }

  backToUpload(): void {
    this.showJsonOutput.set(false);
    this.fileUploaded.set(false);
    this.jsonOutput.set('');
    this.fileName.set('');
    this.uploadedFile = null;
    this.excelData = null;
    this.clearMessages();
  }

  clearJson(): void {
    this.jsonInput.set('');
    this.clearMessages();
  }

  loadSampleData(): void {
    this.jsonInput.set(JSON.stringify(this.sampleData, null, 2));
    this.clearMessages();
    this.showSuccess('Sample data loaded successfully!');
  }

  onJsonEditorChange(value: string): void {
    this.jsonInput.set(value);
  }

  onFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private async handleFile(file: File): Promise<void> {
    this.clearMessages();

    if (!this.fileService.isExcelFile(file)) {
      this.showError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    // Store the file and show upload success
    this.uploadedFile = file;
    this.fileName.set(file.name);
    this.fileUploaded.set(true);
    this.showSuccess('Excel file uploaded successfully! Click "Convert to JSON" to proceed.');
  }

  async convertToJson(): Promise<void> {
    if (!this.uploadedFile) {
      this.showError('No file uploaded');
      return;
    }

    this.clearMessages();
    this.isProcessing.set(true);
    this.progressPercent.set(0);

    try {
      // Simulate processing with progress updates for Excel to JSON
      await this.simulateExcelProcessing();

      const arrayBuffer = await this.fileService.readFileAsArrayBuffer(this.uploadedFile);
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      this.excelData = jsonData;
      this.jsonOutput.set(JSON.stringify(jsonData, null, 2));
      this.showJsonOutput.set(true);
      this.showSuccess('Excel file converted to JSON successfully!');
    } catch (error) {
      this.showError('Error reading Excel file. Please check the file format.');
    } finally {
      this.isProcessing.set(false);
      this.progressMessage.set('');
      this.progressPercent.set(0);
    }
  }

  private async simulateExcelProcessing(): Promise<void> {
    const steps = [
      { message: 'Reading Excel file...', duration: 700 },
      { message: 'Parsing spreadsheet data...', duration: 800 },
      { message: 'Converting to JSON format...', duration: 900 },
      { message: 'Formatting output...', duration: 600 }
    ];

    let totalProgress = 0;
    const stepProgress = 100 / steps.length;

    for (const step of steps) {
      this.progressMessage.set(step.message);

      // Animate progress for this step
      const startProgress = totalProgress;
      const endProgress = totalProgress + stepProgress;
      const animationDuration = step.duration;
      const animationSteps = 20;
      const progressIncrement = stepProgress / animationSteps;
      const timeIncrement = animationDuration / animationSteps;

      for (let i = 0; i < animationSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, timeIncrement));
        this.progressPercent.set(Math.min(startProgress + (progressIncrement * (i + 1)), endProgress));
      }

      totalProgress = endProgress;
    }

    this.progressPercent.set(100);
  }

  downloadJson(): void {
    if (!this.excelData) return;

    try {
      const jsonContent = JSON.stringify(this.excelData, null, 2);
      this.fileService.downloadFile(jsonContent, 'data.json', 'application/json');
      this.showSuccess('JSON file downloaded successfully!');
    } catch (error) {
      this.showError('Error downloading JSON file');
    }
  }

  async copyToClipboard(): Promise<void> {
    try {
      await this.fileService.copyToClipboard(this.jsonOutput());
      this.showSuccess('JSON copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy to clipboard');
    }
  }

  private showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  private clearMessages(): void {
    // Clear all toasts
    this.toasts.set([]);
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = Date.now();
    const newToast = { id, message, type, isVisible: true };

    // Add new toast
    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideToast(id);
    }, 4000);
  }

  hideToast(id: number): void {
    this.toasts.update(toasts =>
      toasts.map(toast =>
        toast.id === id ? { ...toast, isVisible: false } : toast
      )
    );

    // Remove from array after animation completes
    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
    }, 300);
  }

  get canDownloadJson(): boolean {
    return !!this.excelData && this.jsonOutput().length > 0;
  }

  get canCopyJson(): boolean {
    return this.jsonOutput().length > 0;
  }

  setGuideTab(tab: 'jsonToExcel' | 'excelToJson'): void {
    this.guideTab.set(tab);
  }

  get previewTableHeaders(): string[] {
    if (!this.previewData || this.previewData.length === 0) return [];
    return Object.keys(this.previewData[0]);
  }

  get previewTableRows(): any[] {
    return this.previewData || [];
  }
}





