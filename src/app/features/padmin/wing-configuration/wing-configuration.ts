import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WingConfigurationService, WingItem } from '../../../core/services/wing-configuration.service';
import { LoaderService } from '../../../core/services/loader.service';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-wing-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wing-configuration.html',
  styleUrl: './wing-configuration.css'
})
export class WingConfiguration implements OnInit, OnDestroy {
  private readonly service = inject(WingConfigurationService);
  readonly loader = inject(LoaderService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Data
  readonly wings = signal<WingItem[]>([]);
  readonly toasts = signal<Toast[]>([]);
  private toastCounter = 0;

  // UI state
  isLoading = false;
  highlightedId: number | null = null;

  // Filter state
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Pagination
  readonly pageSize = 10;
  currentPage = 1;

  // Add/Edit Modal
  showWingModal = false;
  editingWing: WingItem | null = null;
  savingWing = false;
  wingForm = { code: '', name: '', isActive: true };
  formErrors: { code?: string; name?: string } = {};

  // Delete Modal
  showDeleteModal = false;
  deletingWing: WingItem | null = null;
  deletingWingInProgress = false;

  // Inline toggle
  togglingId: number | null = null;

  // ─── Lifecycle ───────────────────────────────────────────────
  ngOnInit(): void {
    this.loadWings();

    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadWings());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.showDeleteModal) { this.closeDeleteModal(); return; }
    if (this.showWingModal)   { this.closeWingModal();  return; }
  }

  // ─── Load ─────────────────────────────────────────────────────
  loadWings(): void {
    this.isLoading = true;
    const isActive = this.statusFilter === 'all' ? undefined :
                     this.statusFilter === 'active' ? true : false;

    this.service.getWings(this.searchTerm, isActive).subscribe({
      next: (data) => {
        this.wings.set(data);
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.showToast('error', err?.error?.message ?? 'Unable to load wings. Please try again.');
        this.isLoading = false;
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilter(): void { this.loadWings(); }

  resetFilter(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.loadWings();
  }

  // ─── Stats ────────────────────────────────────────────────────
  get totalCount():    number { return this.wings().length; }
  get activeCount():   number { return this.wings().filter(w => w.isActive).length; }
  get inactiveCount(): number { return this.wings().filter(w => !w.isActive).length; }

  // ─── Pagination ───────────────────────────────────────────────
  get totalPages(): number { return Math.ceil(this.wings().length / this.pageSize) || 1; }

  get pagedWings(): WingItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.wings().slice(start, start + this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get showingFrom(): number {
    return this.wings().length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.wings().length);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  // ─── Add / Edit Modal ─────────────────────────────────────────
  openCreateWing(): void {
    this.editingWing = null;
    this.wingForm = { code: '', name: '', isActive: true };
    this.formErrors = {};
    this.showWingModal = true;
  }

  openEditWing(wing: WingItem): void {
    this.editingWing = wing;
    this.wingForm = { code: wing.code, name: wing.name, isActive: wing.isActive };
    this.formErrors = {};
    this.showWingModal = true;
  }

  closeWingModal(): void {
    this.showWingModal = false;
    this.editingWing = null;
    this.formErrors = {};
  }

  validateForm(): boolean {
    this.formErrors = {};
    let ok = true;
    if (!this.wingForm.code.trim()) { this.formErrors['code'] = 'Wing Code is required.'; ok = false; }
    if (!this.wingForm.name.trim()) { this.formErrors['name'] = 'Wing Name is required.'; ok = false; }
    return ok;
  }

  saveWing(): void {
    if (!this.validateForm()) return;
    this.savingWing = true;

    const payload = {
      code: this.wingForm.code.trim(),
      name: this.wingForm.name.trim(),
      isActive: this.wingForm.isActive
    };

    const request = this.editingWing
      ? this.service.updateWing(this.editingWing.id, payload)
      : this.service.createWing(payload);

    request.subscribe({
      next: (saved) => {
        this.showWingModal = false;
        this.showToast('success', this.editingWing ? `"${saved.name}" updated successfully.` : `"${saved.name}" created successfully.`);
        this.savingWing = false;
        this.loadWings();
        this.highlightRow(saved.id);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Unable to save wing. Please try again.';
        // Show in-form error for duplicate
        if (msg.toLowerCase().includes('code')) {
          this.formErrors['code'] = msg;
        } else if (msg.toLowerCase().includes('name')) {
          this.formErrors['name'] = msg;
        } else {
          this.showToast('error', msg);
        }
        this.savingWing = false;
      }
    });
  }

  // ─── Inline Status Toggle ─────────────────────────────────────
  toggleStatus(wing: WingItem): void {
    if (this.togglingId === wing.id) return;
    this.togglingId = wing.id;

    const payload = { code: wing.code, name: wing.name, isActive: !wing.isActive };

    this.service.updateWing(wing.id, payload).subscribe({
      next: (updated) => {
        this.wings.update(list =>
          list.map(w => w.id === updated.id ? updated : w)
        );
        this.togglingId = null;
        this.showToast('success', `"${updated.name}" ${updated.isActive ? 'activated' : 'deactivated'}.`);
      },
      error: (err) => {
        this.togglingId = null;
        this.showToast('error', err?.error?.message ?? 'Unable to update status.');
      }
    });
  }

  // ─── Delete ───────────────────────────────────────────────────
  openDeleteConfirm(wing: WingItem): void {
    this.deletingWing = wing;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingWing = null;
  }

  confirmDelete(): void {
    if (!this.deletingWing) return;
    const wing = this.deletingWing;
    this.deletingWingInProgress = true;

    this.service.deleteWing(wing.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.deletingWing = null;
        this.deletingWingInProgress = false;
        this.showToast('success', `"${wing.name}" deactivated successfully.`);
        this.loadWings();
      },
      error: (err) => {
        this.showToast('error', err?.error?.message ?? 'Unable to delete wing. Please try again.');
        this.deletingWingInProgress = false;
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────
  private highlightRow(id: number): void {
    this.highlightedId = id;
    setTimeout(() => { this.highlightedId = null; }, 2200);
  }

  // ─── Toast ────────────────────────────────────────────────────
  showToast(type: 'success' | 'error', message: string): void {
    const id = ++this.toastCounter;
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.removeToast(id), 4000);
  }

  removeToast(id: number): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
