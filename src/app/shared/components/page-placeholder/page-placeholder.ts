import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-placeholder',
  standalone: true,
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.css'
})
export class PagePlaceholder {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
