import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';
import { BrandLogo } from '../brand-logo/brand-logo';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [BrandLogo],
  templateUrl: './app-loader.html',
  styleUrl: './app-loader.css'
})
export class AppLoader {
  readonly loader = inject(LoaderService);
}
