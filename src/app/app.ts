import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLoader } from './shared/components/app-loader/app-loader';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppLoader],
  template: `
    <router-outlet></router-outlet>
    <app-loader></app-loader>
  `
})
export class App {
  private readonly _theme = inject(ThemeService);
}
