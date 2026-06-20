import { Component, input } from '@angular/core';

export type BrandLogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  templateUrl: './brand-logo.html',
  styleUrl: './brand-logo.css'
})
export class BrandLogo {
  size = input<BrandLogoSize>('md');
  showTagline = input(false);
  interactive = input(true);
  animate = input(true);
}
