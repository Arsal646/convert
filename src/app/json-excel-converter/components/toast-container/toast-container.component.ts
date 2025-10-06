import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['../../json-excel-converter.component.css', './toast-container.component.css']
})
export class ToastContainerComponent {
  @Input() toasts: Toast[] = [];
  @Output() dismiss = new EventEmitter<number>();

  onDismiss(id: number): void {
    this.dismiss.emit(id);
  }
}
