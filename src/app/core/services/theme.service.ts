import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'premisus-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly theme = signal<AppTheme>(this.readStoredTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(theme: AppTheme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: AppTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }

  private readStoredTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // ignore storage errors
    }

    return 'dark';
  }
}
