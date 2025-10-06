import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { ConversionMode } from '../../models/conversion-mode';

@Component({
  selector: 'app-guide-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-modal.component.html',
  styleUrls: ['./guide-modal.component.css']
})
export class GuideModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: ConversionMode = 'jsonToExcel';
  @Output() close = new EventEmitter<void>();

  isVisible = false;
  isAnimating = false;
  animationState: 'entering' | 'entered' | 'leaving' | 'left' = 'left';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openModal();
      } else {
        this.closeModal();
      }
    }
  }

  private openModal(): void {
    if (this.isAnimating) return;
    
    this.isVisible = true;
    this.isAnimating = true;
    this.animationState = 'entering';
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.animationState = 'entered';
      setTimeout(() => {
        this.isAnimating = false;
      }, 400); // Match animation duration
    }, 10);
  }

  private closeModal(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animationState = 'leaving';
    
    setTimeout(() => {
      this.isVisible = false;
      this.animationState = 'left';
      this.isAnimating = false;
      this.close.emit();
    }, 300); // Match animation duration
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isAnimating) {
      this.closeModal();
    }
  }

  onCloseClick(): void {
    if (!this.isAnimating) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isVisible && !this.isAnimating) {
      this.closeModal();
    }
  }

  get backdropClasses(): string {
    const baseClasses = 'modal-backdrop';
    if (this.animationState === 'entered') {
      return `${baseClasses} animate-in`;
    } else if (this.animationState === 'leaving') {
      return `${baseClasses} animate-out`;
    }
    return baseClasses;
  }

  get contentClasses(): string {
    const baseClasses = 'modal-content';
    if (this.animationState === 'entering') {
      return `${baseClasses} slide-up`;
    } else if (this.animationState === 'entered') {
      return `${baseClasses} animate-in`;
    } else if (this.animationState === 'leaving') {
      return `${baseClasses} slide-down`;
    }
    return baseClasses;
  }
}