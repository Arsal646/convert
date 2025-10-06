import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, EventEmitter, Output } from '@angular/core';
import * as XLSX from 'xlsx';
import { FileService } from '../../../services/file.service';
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
  selector: 'app-excel-to-json-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, LoadingOverlayComponent, ToastContainerComponent],
  templateUrl: './excel-to-json-panel.component.html',
  styleUrls: ['../../json-excel-converter.component.css', './excel-to-json-panel.component.css']
})
export class ExcelToJsonPanelComponent {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @Output() openGuide = new EventEmitter<void>();

  fileUploaded = false;
  showJsonOutput = false;
  isProcessing = false;
  progressMessage = '';
  progressPercent = 0;
  showFireworks = false;

  fileName = '';
  jsonOutput = '';
  toasts: Toast[] = [];
  isDragOver = false;

  private excelData: any[] | null = null;
  private uploadedFile: File | null = null;
  private readonly fileService = inject(FileService);

  triggerFileBrowse(): void {
    this.fileInput?.nativeElement.click();
  }

  openGuideModal(): void {
    this.openGuide.emit();
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    this.clearMessages();

    if (!this.fileService.isExcelFile(file)) {
      this.showError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    this.uploadedFile = file;
    this.fileName = file.name;
    this.fileUploaded = true;
    this.showJsonOutput = false;
    this.jsonOutput = '';
    this.excelData = null;
    this.showFireworks = false;
    this.showSuccess('Excel file uploaded successfully! Click "Convert to JSON" to proceed.');
  }

  async convertToJson(): Promise<void> {
    if (!this.uploadedFile) {
      this.showError('No file uploaded');
      return;
    }

    this.clearMessages();
    this.isProcessing = true;
    this.progressPercent = 0;

    try {
      await this.simulateExcelProcessing();

      const arrayBuffer = await this.fileService.readFileAsArrayBuffer(this.uploadedFile);
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      this.excelData = jsonData;
      this.jsonOutput = JSON.stringify(jsonData, null, 2);
      this.showJsonOutput = true;
      this.showFireworks = true;
      setTimeout(() => {
        this.showFireworks = false;
      }, 1200);
      this.showSuccess('Excel file converted to JSON successfully!');
    } catch (error) {
      this.showError('Error reading Excel file. Please check the file format.');
    } finally {
      this.isProcessing = false;
      this.progressMessage = '';
      this.progressPercent = 0;
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

  backToUpload(): void {
    this.showJsonOutput = false;
    this.fileUploaded = false;
    this.jsonOutput = '';
    this.fileName = '';
    this.uploadedFile = null;
    this.excelData = null;
    this.showFireworks = false;
    this.clearMessages();
  }

  downloadJson(): void {
    if (!this.excelData) {
      return;
    }

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
      await this.fileService.copyToClipboard(this.jsonOutput);
      this.showSuccess('JSON copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy to clipboard');
    }
  }

  newUpload(): void {
    this.backToUpload();
    this.clearMessages();
  }

  get recordCount(): number {
    return this.excelData?.length ?? 0;
  }

  dismissToast(id: number): void {
    this.hideToast(id);
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

  private hideToast(id: number): void {
    this.toasts = this.toasts.map(toast =>
      toast.id === id ? { ...toast, isVisible: false } : toast
    );

    setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
    }, 300);
  }
}
