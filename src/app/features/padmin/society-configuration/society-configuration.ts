import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FlatItem,
  FloorItem,
  SocietyConfigurationService,
  SocietyStructure,
  SocietySummary,
  WingItem
} from '../../../core/services/society-configuration.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ActivatedRoute, Router } from '@angular/router';

export interface SpcFormItem {
  name: string;
  designation: string;
  contact: string;
}

@Component({
  selector: 'app-society-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './society-configuration.html',
  styleUrl: './society-configuration.css'
})
export class SocietyConfiguration implements OnInit {
  private readonly service = inject(SocietyConfigurationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loader = inject(LoaderService);

  readonly societies = signal<SocietySummary[]>([]);
  readonly structure = signal<SocietyStructure | null>(null);
  readonly masterWings = signal<WingItem[]>([]);
  readonly masterFloors = signal<FloorItem[]>([]);
  readonly masterFlats = signal<FlatItem[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  searchTerm = '';
  viewMode: 'list' | 'configure' = 'list';
  selectedSocietyId: number | null = null;
  flatSearchTerm = '';

  societyForm: {
    socName: string;
    email: string;
    phone: string;
    spcs: SpcFormItem[];
  } = {
    socName: '',
    email: '',
    phone: '',
    spcs: [{ name: '', designation: '', contact: '' }]
  };

  formErrors: Record<string, string> = {};
  showSocietyModal = false;
  editingSociety: SocietySummary | null = null;
  savingSociety = false;

  selectedWingId: number | null = null;
  selectedFloorId: number | null = null;
  selectedFlatIds = new Set<number>();
  savingMapping = false;
  addMappingProgress = 0;
  addMappingTotal = 0;

  expandedWingIds = new Set<number>();

  ngOnInit(): void {
    this.loadSocieties();
    const qId = this.route.snapshot.queryParams['societyId'] ?? this.route.snapshot.queryParams['id'];
    if (qId) {
      const id = Number(qId);
      if (!isNaN(id) && id > 0) {
        this.selectedSocietyId = id;
        this.viewMode = 'configure';
        this.loadMasterData();
        this.loadStructure();
      }
    }
  }

  navigateToAddSocietyAdmin(): void {
    if (this.selectedSocietyId) {
      void this.router.navigate(['/padmin/society-configuration', this.selectedSocietyId, 'add-admin']);
    }
  }

  loadSocieties(): void {
    this.loader.show();
    this.service.getSocieties(this.searchTerm).subscribe({
      next: (data) => {
        this.societies.set(data);
        this.loader.hide();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Unable to load societies. Please try again.');
        this.loader.hide();
      }
    });
  }

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phonePattern = /^[0-9+()\-\s]{7,15}$/;

  resetSocietyForm(): void {
    this.societyForm = {
      socName: '',
      email: '',
      phone: '',
      spcs: [{ name: '', designation: '', contact: '' }]
    };
    this.formErrors = {};
  }

  addSpc(): void {
    this.societyForm.spcs.push({
      name: '',
      designation: '',
      contact: ''
    });
  }

  removeSpc(index: number): void {
    if (this.societyForm.spcs.length > 1) {
      this.societyForm.spcs.splice(index, 1);
      this.reindexSpcErrors();
    }
  }

  private reindexSpcErrors(): void {
    const newErrors: Record<string, string> = {};
    for (const key of Object.keys(this.formErrors)) {
      if (!key.startsWith('spc_')) {
        newErrors[key] = this.formErrors[key];
      }
    }
    this.formErrors = newErrors;
  }

  validateSocietyForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    const socName = this.societyForm.socName ? this.societyForm.socName.trim() : '';
    if (!socName) {
      this.formErrors['socName'] = 'Society name is required.';
      isValid = false;
    } else if (socName.length > 100) {
      this.formErrors['socName'] = 'Society name should be under 100 characters.';
      isValid = false;
    }

    const email = this.societyForm.email ? this.societyForm.email.trim() : '';
    if (!email) {
      this.formErrors['email'] = 'Email is required.';
      isValid = false;
    } else if (!this.emailPattern.test(email)) {
      this.formErrors['email'] = 'Enter a valid email address.';
      isValid = false;
    }

    const phone = this.societyForm.phone ? this.societyForm.phone.trim() : '';
    if (!phone) {
      this.formErrors['phone'] = 'Phone number is required.';
      isValid = false;
    } else if (!this.phonePattern.test(phone)) {
      this.formErrors['phone'] = 'Enter a valid phone number.';
      isValid = false;
    }

    if (!this.societyForm.spcs || this.societyForm.spcs.length === 0) {
      this.formErrors['spcGeneral'] = 'At least one SPC is required.';
      isValid = false;
    } else {
      this.societyForm.spcs.forEach((spc, index) => {
        const name = spc.name ? spc.name.trim() : '';
        if (!name) {
          this.formErrors[`spc_${index}_name`] = 'Name is required.';
          isValid = false;
        } else if (name.length > 100) {
          this.formErrors[`spc_${index}_name`] = 'Name should be under 100 characters.';
          isValid = false;
        }

        const designation = spc.designation ? spc.designation.trim() : '';
        if (!designation) {
          this.formErrors[`spc_${index}_designation`] = 'Designation is required.';
          isValid = false;
        } else if (designation.length > 80) {
          this.formErrors[`spc_${index}_designation`] = 'Designation should be under 80 characters.';
          isValid = false;
        }

        const contact = spc.contact ? spc.contact.trim() : '';
        if (!contact) {
          this.formErrors[`spc_${index}_contact`] = 'Contact is required.';
          isValid = false;
        } else if (!this.phonePattern.test(contact)) {
          this.formErrors[`spc_${index}_contact`] = 'Enter a valid phone number.';
          isValid = false;
        }
      });
    }

    return isValid;
  }

  openCreateSociety(): void {
    this.editingSociety = null;
    this.resetSocietyForm();
    this.showSocietyModal = true;
  }

  openEditSociety(society: SocietySummary): void {
    this.editingSociety = society;
    this.societyForm = {
      socName: society.name ?? '',
      email: society.email ?? '',
      phone: society.phone ?? '',
      spcs: [{ name: '', designation: '', contact: '' }]
    };
    this.formErrors = {};
    this.showSocietyModal = true;

    this.service.getById(society.id).subscribe({
      next: (data: any) => {
        if (!data) return;
        this.societyForm.socName = data.socName ?? data.name ?? society.name ?? '';
        this.societyForm.email = data.email ?? society.email ?? '';
        this.societyForm.phone = data.phone ?? society.phone ?? '';

        let spcRaw = data.spcDtl ?? data.SpcDtl;
        if (typeof spcRaw === 'string') {
          try {
            spcRaw = JSON.parse(spcRaw);
          } catch {
            spcRaw = [];
          }
        }

        if (Array.isArray(spcRaw) && spcRaw.length > 0) {
          this.societyForm.spcs = spcRaw.map((item: any) => ({
            name: item.Name ?? item.name ?? '',
            designation: item.Designation ?? item.designation ?? '',
            contact: item.Contact ?? item.contact ?? ''
          }));
        } else if (spcRaw && typeof spcRaw === 'object' && Object.keys(spcRaw).length > 0) {
          this.societyForm.spcs = [{
            name: spcRaw.Name ?? spcRaw.name ?? '',
            designation: spcRaw.Designation ?? spcRaw.designation ?? '',
            contact: spcRaw.Contact ?? spcRaw.contact ?? ''
          }];
        } else {
          this.societyForm.spcs = [{ name: '', designation: '', contact: '' }];
        }
      },
      error: () => {
        // Fallback to basic details if request fails
      }
    });
  }

  saveSociety(): void {
    if (!this.validateSocietyForm()) {
      this.errorMessage.set('Please correct the highlighted fields and try again.');
      return;
    }

    this.savingSociety = true;
    this.errorMessage.set('');
    this.loader.show();

    const payload = this.service.buildPmAccountPayload({
      socName: this.societyForm.socName,
      email: this.societyForm.email,
      phone: this.societyForm.phone,
      spcs: this.societyForm.spcs
    });

    const request = this.editingSociety
      ? this.service.updateSociety(this.editingSociety.id, payload)
      : this.service.createSociety(payload);

    request.subscribe({
      next: () => {
        this.showSocietyModal = false;
        this.successMessage.set(
          this.editingSociety ? 'Society updated successfully.' : 'Society created successfully.'
        );
        this.resetSocietyForm();
        this.loadSocieties();
        this.savingSociety = false;
        this.loader.hide();
      },
      error: (err) => {
        const message = err?.error?.message ?? err?.message ?? 'Unable to save the society. Please try again.';
        this.errorMessage.set(message);
        this.savingSociety = false;
        this.loader.hide();
      }
    });
  }

  async deleteSociety(society: SocietySummary): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete society?',
      message: `This will permanently delete "${society.name}". You cannot undo this if the society has no active configuration.`,
      confirmLabel: 'Delete Society',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.loader.show();
    this.service.deleteSociety(society.id).subscribe({
      next: () => {
        this.successMessage.set('Society deleted successfully.');
        if (this.selectedSocietyId === society.id) {
          this.backToList();
        }
        this.loadSocieties();
        this.loader.hide();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Unable to delete the society. Please try again.');
        this.loader.hide();
      }
    });
  }

  configureSociety(society: SocietySummary): void {
    this.selectedSocietyId = society.id;
    this.viewMode = 'configure';
    this.resetMappingForm();
    this.loadMasterData();
    this.loadStructure();
  }

  backToList(): void {
    this.viewMode = 'list';
    this.selectedSocietyId = null;
    this.structure.set(null);
    this.resetMappingForm();
    this.expandedWingIds.clear();
  }

  resetMappingForm(): void {
    this.selectedWingId = null;
    this.selectedFloorId = null;
    this.selectedFlatIds = new Set<number>();
    this.flatSearchTerm = '';
    this.masterFloors.set([]);
  }

  loadMasterData(): void {
    this.service.getMasterWings().subscribe({
      next: (wings) => this.masterWings.set(wings),
      error: () => this.errorMessage.set('Unable to load wings. Please try again.')
    });

    this.service.getMasterFlats().subscribe({
      next: (flats) => this.masterFlats.set(flats),
      error: () => this.errorMessage.set('Unable to load flats. Please try again.')
    });
  }

  loadFloorsForWing(wingId: number | null): void {
    this.selectedFloorId = null;
    this.selectedFlatIds = new Set<number>();
    this.flatSearchTerm = '';

    if (!wingId) {
      this.masterFloors.set([]);
      return;
    }

    this.service.getMasterFloors(wingId).subscribe({
      next: (floors) => this.masterFloors.set(floors),
      error: () => this.errorMessage.set('Unable to load floors. Please try again.')
    });
  }

  onWingSelected(wingId: number | null): void {
    this.selectedWingId = wingId;
    this.loadFloorsForWing(wingId);
    this.syncSelectedFlat();
  }

  selectFloorContext(floorId: number | null): void {
    this.selectedFloorId = floorId;
    this.selectedFlatIds = new Set<number>();
    this.flatSearchTerm = '';
    this.syncSelectedFlat();
  }

  availableFlatsForMapping(): FlatItem[] {
    const wingId = this.selectedWingId;
    if (!wingId) return [];
    const usedFlatIds = this.getMappedFlatIdsForWing(wingId);
    return this.masterFlats().filter((f) => !usedFlatIds.has(f.id));
  }

  filteredFlatsForPicker(): FlatItem[] {
    const term = this.flatSearchTerm.trim().toLowerCase();
    const available = this.availableFlatsForMapping();
    if (!term) return available;
    return available.filter(f => f.code.toLowerCase().includes(term) || (f.typeName?.toLowerCase().includes(term)));
  }

  toggleFlatId(id: number): void {
    if (this.selectedFlatIds.has(id)) {
      this.selectedFlatIds.delete(id);
    } else {
      this.selectedFlatIds.add(id);
    }
    this.selectedFlatIds = new Set(this.selectedFlatIds);
  }

  selectAllFlats(checked: boolean): void {
    this.selectedFlatIds = checked
      ? new Set(this.filteredFlatsForPicker().map(f => f.id))
      : new Set<number>();
  }

  get allFilteredFlatsSelected(): boolean {
    const filtered = this.filteredFlatsForPicker();
    return filtered.length > 0 && filtered.every(f => this.selectedFlatIds.has(f.id));
  }

  get someFilteredFlatsSelected(): boolean {
    const filtered = this.filteredFlatsForPicker();
    return filtered.some(f => this.selectedFlatIds.has(f.id)) && !this.allFilteredFlatsSelected;
  }

  private getMappedFlatIdsForWing(wingId: number): Set<number> {
    const used = new Set<number>();
    const wingNode = this.structure()?.wings.find((w) => w.wing.id === wingId);
    if (!wingNode) {
      return used;
    }

    for (const floorNode of wingNode.floors) {
      for (const flat of floorNode.flats) {
        used.add(flat.id);
      }
    }

    return used;
  }

  private syncSelectedFlat(): void {
    const available = new Set(this.availableFlatsForMapping().map(f => f.id));
    this.selectedFlatIds = new Set([...this.selectedFlatIds].filter(id => available.has(id)));
  }

  loadStructure(): void {
    if (!this.selectedSocietyId) {
      return;
    }

    this.loader.show();
    this.service.getStructure(this.selectedSocietyId).subscribe({
      next: (data) => {
        this.structure.set(data);
        this.expandedWingIds = new Set(data.wings.map((w) => w.wing.id));
        this.syncSelectedFlat();
        this.loader.hide();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Unable to load society structure. Please try again.');
        this.loader.hide();
      }
    });
  }

  addMappings(): void {
    if (!this.selectedSocietyId || !this.selectedWingId || !this.selectedFloorId) {
      this.errorMessage.set('Please select a wing and floor.');
      return;
    }
    if (this.selectedFlatIds.size === 0) {
      this.errorMessage.set('Please select at least one flat.');
      return;
    }
    this.savingMapping = true;
    this.addMappingProgress = 0;
    this.addMappingTotal = this.selectedFlatIds.size;
    this.loader.show();

    const flatIds = [...this.selectedFlatIds];
    const societyId = this.selectedSocietyId;
    const wingId = this.selectedWingId;
    const floorId = this.selectedFloorId;

    const addNext = (index: number): void => {
      if (index >= flatIds.length) {
        this.selectedFlatIds = new Set<number>();
        this.flatSearchTerm = '';
        this.successMessage.set(`${flatIds.length} flat(s) added to the structure successfully.`);
        this.loadStructure();
        this.loadSocieties();
        this.savingMapping = false;
        this.loader.hide();
        return;
      }

      this.service.addMapping(societyId!, { wingId: wingId!, floorId: floorId!, flatId: flatIds[index] }).subscribe({
        next: () => {
          this.addMappingProgress = index + 1;
          addNext(index + 1);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? `Unable to add flat ${flatIds[index]}. Please try again.`);
          this.savingMapping = false;
          this.loader.hide();
        }
      });
    };

    addNext(0);
  }

  selectWing(wingId: number): void {
    this.onWingSelected(wingId);
  }

  selectFloor(floorId: number): void {
    this.selectedFloorId = floorId;
  }

  toggleWingExpanded(wingId: number): void {
    if (this.expandedWingIds.has(wingId)) {
      this.expandedWingIds.delete(wingId);
    } else {
      this.expandedWingIds.add(wingId);
    }
  }

  isWingExpanded(wingId: number): boolean {
    return this.expandedWingIds.has(wingId);
  }

  async deactivateWing(wingId: number): Promise<void> {
    if (!this.selectedSocietyId) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove wing from structure?',
      message: 'This will remove all floors and flats configured under this wing for this society.',
      confirmLabel: 'Remove Wing',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.service.deactivateWing(this.selectedSocietyId, wingId).subscribe({
      next: () => {
        this.successMessage.set('Wing removed from the structure.');
        this.loadStructure();
        this.loadSocieties();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove the wing. Please try again.')
    });
  }

  async deactivateFloor(wingId: number, floorId: number): Promise<void> {
    if (!this.selectedSocietyId) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove floor from structure?',
      message: 'This will remove all flats configured on this floor for this wing.',
      confirmLabel: 'Remove Floor',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.service.deactivateFloor(this.selectedSocietyId, wingId, floorId).subscribe({
      next: () => {
        this.successMessage.set('Floor removed from the structure.');
        this.loadStructure();
        this.loadSocieties();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove the floor. Please try again.')
    });
  }

  async deactivateFlat(wingId: number, floorId: number, flatId: number): Promise<void> {
    if (!this.selectedSocietyId) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove flat from structure?',
      message: 'This flat will no longer be part of this society configuration.',
      confirmLabel: 'Remove Flat',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    this.service.deactivateFlat(this.selectedSocietyId, wingId, floorId, flatId).subscribe({
      next: () => {
        this.successMessage.set('Flat removed from the structure.');
        this.loadStructure();
        this.loadSocieties();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove the flat. Please try again.')
    });
  }

  wingLabel(wing: WingItem): string {
    return wing.name;
  }

  floorLabel(floor: FloorItem): string {
    return `${floor.name} (${floor.floorNumber})`;
  }

  flatLabel(flat: FlatItem): string {
    return flat.code;
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
