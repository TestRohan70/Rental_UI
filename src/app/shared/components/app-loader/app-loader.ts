import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './app-loader.html',
  styleUrl: './app-loader.css'
})
export class AppLoader {
  readonly loader = inject(LoaderService);
}
