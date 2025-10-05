import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

import type * as monaco from 'monaco-editor';

const MONACO_LOADER_URL = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.51.0/min/vs/loader.min.js';
const MONACO_BASE_URL = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.51.0/min/vs';

let monacoLoaderPromise: Promise<typeof monaco> | null = null;

function loadMonaco(): Promise<typeof monaco> {
  const existing = (window as any).monaco as typeof monaco | undefined;
  if (existing) {
    return Promise.resolve(existing);
  }

  if (monacoLoaderPromise) {
    return monacoLoaderPromise;
  }

  monacoLoaderPromise = new Promise<typeof monaco>((resolve, reject) => {
    const onAmdLoaderAvailable = () => {
      const globalRequire = (window as any).require;
      if (!globalRequire) {
        reject(new Error('Monaco AMD loader is not available.'));
        return;
      }

      (window as any).MonacoEnvironment = {
        getWorkerUrl: (_moduleId: string, label: string) => {
          let worker = 'editor/editor.worker.js';
          if (label === 'json') {
            worker = 'language/json/json.worker.js';
          } else if (label === 'css') {
            worker = 'language/css/css.worker.js';
          } else if (label === 'html') {
            worker = 'language/html/html.worker.js';
          } else if (label === 'typescript' || label === 'javascript') {
            worker = 'language/typescript/ts.worker.js';
          }

          const script = `self.MonacoEnvironment={baseUrl:'${MONACO_BASE_URL}/'};` +
            `importScripts('${MONACO_BASE_URL}/${worker}');`;
          return `data:text/javascript;charset=utf-8,${encodeURIComponent(script)}`;
        }
      };

      globalRequire.config({ paths: { vs: MONACO_BASE_URL } });
      globalRequire(['vs/editor/editor.main'], () => {
        const monacoInstance = (window as any).monaco as typeof monaco | undefined;
        if (monacoInstance) {
          resolve(monacoInstance);
        } else {
          reject(new Error('Monaco failed to load.'));
        }
      });
    };

    const globalRequire = (window as any).require;
    if (globalRequire) {
      onAmdLoaderAvailable();
      return;
    }

    const script = document.createElement('script');
    script.src = MONACO_LOADER_URL;
    script.async = true;
    script.onload = onAmdLoaderAvailable;
    script.onerror = () => reject(new Error('Failed to load Monaco loader script.'));
    document.body.appendChild(script);
  });

  return monacoLoaderPromise;
}

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monaco-wrapper" [class.monaco-wrapper--focused]="isFocused">
      <div class="monaco-placeholder" *ngIf="placeholder && showPlaceholder">{{ placeholder }}</div>
      <div #container class="monaco-editor-container" [style.height]="height"></div>
    </div>
  `,
  styleUrls: ['./monaco-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() language = 'json';
  @Input() theme: monaco.editor.BuiltinTheme = 'vs';
  @Input() height = '24rem';
  @Input() readOnly = false;
  @Input() placeholder = '';

  @ViewChild('container', { static: true }) private container!: ElementRef<HTMLDivElement>;

  private monacoInstance: typeof monaco | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private isSettingModel = false;
  private disposables: monaco.IDisposable[] = [];

  showPlaceholder = true;
  isFocused = false;

  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.monacoInstance = await loadMonaco();
      this.initEditor();
    } catch (error) {
      console.error('Failed to load Monaco editor', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) {
      return;
    }

    if (changes['value'] && !this.isSettingModel) {
      const newValue = changes['value'].currentValue ?? '';
      if (newValue !== this.editor.getValue()) {
        this.editor.setValue(newValue);
        this.updatePlaceholderVisibility(newValue);
      }
    }

    if (changes['language'] && this.monacoInstance && this.editor) {
      const model = this.editor.getModel();
      if (model) {
        this.monacoInstance.editor.setModelLanguage(model, this.language);
      }
    }

    if (changes['readOnly'] && this.editor) {
      this.editor.updateOptions({ readOnly: this.readOnly });
    }
  }

  ngOnDestroy(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.editor?.dispose();
    this.editor = null;
  }

  private initEditor(): void {
    if (!this.monacoInstance) {
      return;
    }

    this.editor = this.monacoInstance.editor.create(this.container.nativeElement, {
      value: this.value ?? '',
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: 13,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
      smoothScrolling: true
    });

    this.updatePlaceholderVisibility(this.editor.getValue());

    this.disposables.push(
      this.editor.onDidChangeModelContent(() => {
        if (this.readOnly) {
          return;
        }
        const newValue = this.editor?.getValue() ?? '';
        this.isSettingModel = true;
        this.valueChange.emit(newValue);
        this.updatePlaceholderVisibility(newValue);
        this.isSettingModel = false;
      })
    );

    this.disposables.push(
      this.editor.onDidFocusEditorText(() => {
        this.isFocused = true;
        this.cdr.markForCheck();
      })
    );

    this.disposables.push(
      this.editor.onDidBlurEditorText(() => {
        this.isFocused = false;
        this.cdr.markForCheck();
      })
    );
  }

  private updatePlaceholderVisibility(content: string): void {
    const shouldShow = !content || content.trim().length === 0;
    if (this.showPlaceholder !== shouldShow) {
      this.showPlaceholder = shouldShow;
      this.cdr.markForCheck();
    }
  }
}
