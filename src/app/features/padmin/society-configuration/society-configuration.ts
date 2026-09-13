import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {

  FlatItem,

  FloorItem,

  GenerateStructurePreview,

  GenerateStructureRequest,

  SocietyConfigurationService,

  SocietyStructure,

  SocietySummary,

  WingItem

} from '../../../core/services/society-configuration.service';

import { LoaderService } from '../../../core/services/loader.service';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

import { ActivatedRoute, Router } from '@angular/router';



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

  readonly preview = signal<GenerateStructurePreview | null>(null);

  readonly masterWings = signal<WingItem[]>([]);

  readonly masterFloors = signal<FloorItem[]>([]);

  readonly masterFlats = signal<FlatItem[]>([]);

  readonly generateFloors = signal<FloorItem[]>([]);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');



  searchTerm = '';

  viewMode: 'list' | 'configure' = 'list';

  selectedSocietyId: number | null = null;

  flatSearchTerm = '';



  societyForm = { name: '', location: '' };

  showSocietyModal = false;

  editingSociety: SocietySummary | null = null;

  savingSociety = false;



  selectedWingId: number | null = null;

  selectedFloorId: number | null = null;

  selectedFlatIds = new Set<number>();

  savingMapping = false;

  addMappingProgress = 0;

  addMappingTotal = 0;



  generateWingIds = new Set<number>();

  generateFloorIds = new Set<number>();

  generateFlatIds = new Set<number>();

  generateStep = 1;

  generating = false;



  showGenerateModal = false;

  expandedWingIds = new Set<number>();



  readonly generateSteps = [

    'Select Wings',

    'Select Floors',

    'Select Flats',

    'Preview & Confirm'

  ];



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



  openCreateSociety(): void {

    this.editingSociety = null;

    this.societyForm = { name: '', location: '' };

    this.showSocietyModal = true;

  }



  openEditSociety(society: SocietySummary): void {

    this.editingSociety = society;

    this.societyForm = { name: society.name, location: society.location ?? '' };

    this.showSocietyModal = true;

  }



  saveSociety(): void {

    if (!this.societyForm.name.trim()) {

      this.errorMessage.set('Society name is required.');

      return;

    }



    this.savingSociety = true;

    this.loader.show();

    const payload = {

      name: this.societyForm.name.trim(),

      location: this.societyForm.location.trim() || undefined

    };



    const request = this.editingSociety

      ? this.service.updateSociety(this.editingSociety.id, payload)

      : this.service.createSociety(payload);



    request.subscribe({

      next: () => {

        this.showSocietyModal = false;

        this.successMessage.set(

          this.editingSociety ? 'Society updated successfully.' : 'Society created successfully.'

        );

        this.loadSocieties();

        this.savingSociety = false;

        this.loader.hide();

      },

      error: (err) => {

        this.errorMessage.set(err?.error?.message ?? 'Unable to save the society. Please try again.');

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

    this.preview.set(null);

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
    this.selectedFlatIds = new Set(this.selectedFlatIds); // trigger change detection
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



  openGenerateModal(): void {

    this.preview.set(null);

    this.generateStep = 1;

    this.generateWingIds = new Set(this.masterWings().map((w) => w.id));

    this.generateFlatIds = new Set(this.masterFlats().map((f) => f.id));

    this.generateFloorIds = new Set();



    this.service.getMasterFloors().subscribe({

      next: (floors) => {

        this.generateFloors.set(floors);

        this.syncGenerateFloorSelection(floors);

      },

      error: () => this.errorMessage.set('Unable to load floors. Please try again.')

    });



    this.showGenerateModal = true;

  }



  closeGenerateModal(): void {

    this.showGenerateModal = false;

    this.generateStep = 1;

    this.preview.set(null);

  }



  filteredFloorsForGenerate(): FloorItem[] {
    return this.generateFloors();
  }

  private syncGenerateFloorSelection(floors: FloorItem[]): void {
    if (this.generateFloorIds.size === 0 && floors.length > 0) {
      this.generateFloorIds = new Set(floors.map((f) => f.id));
    } else {
      const validIds = new Set(floors.map((f) => f.id));
      this.generateFloorIds = new Set([...this.generateFloorIds].filter((id) => validIds.has(id)));
    }
  }

  toggleGenerateId(set: Set<number>, id: number, checked: boolean): void {
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
  }

  selectAllGenerate(type: 'wings' | 'floors' | 'flats', checked: boolean): void {
    if (type === 'wings') {
      this.generateWingIds = checked ? new Set(this.masterWings().map((w) => w.id)) : new Set();
    } else if (type === 'floors') {

      const ids = this.filteredFloorsForGenerate().map((f) => f.id);

      this.generateFloorIds = checked ? new Set(ids) : new Set();

    } else {

      this.generateFlatIds = checked ? new Set(this.masterFlats().map((f) => f.id)) : new Set();

    }

  }



  async nextGenerateStep(): Promise<void> {

    if (this.generateStep === 1 && this.generateWingIds.size === 0) {

      this.errorMessage.set('Please select at least one wing.');

      return;

    }

    if (this.generateStep === 2 && this.generateFloorIds.size === 0) {

      this.errorMessage.set('Please select at least one floor.');

      return;

    }

    if (this.generateStep === 3 && this.generateFlatIds.size === 0) {

      this.errorMessage.set('Please select at least one flat.');

      return;

    }



    if (this.generateStep === 3) {

      await this.previewGenerate();

      if (this.preview()) {

        this.generateStep = 4;

      }

      return;

    }



    this.generateStep += 1;

  }



  prevGenerateStep(): void {

    if (this.generateStep > 1) {

      this.generateStep -= 1;

      if (this.generateStep < 4) {

        this.preview.set(null);

      }

    }

  }



  previewGenerate(): Promise<void> {

    return new Promise((resolve) => {

      if (!this.selectedSocietyId) {

        resolve();

        return;

      }



      const payload = this.buildGeneratePayload(true);

      if (!payload) {

        resolve();

        return;

      }



      this.loader.show();

      this.service.generateStructure(this.selectedSocietyId, payload).subscribe({

        next: (data) => {

          this.preview.set(data);

          this.loader.hide();

          resolve();

        },

        error: (err) => {

          this.errorMessage.set(err?.error?.message ?? 'Unable to preview the structure. Please try again.');

          this.loader.hide();

          resolve();

        }

      });

    });

  }



  async confirmGenerate(): Promise<void> {

    if (!this.selectedSocietyId || !this.preview()) {

      return;

    }



    const confirmed = await this.confirmDialog.confirm({

      title: 'Generate structure?',

      message: `You are about to configure ${this.preview()!.totalMappings} flat(s) for this society. Existing configurations will be preserved; duplicates will be skipped.`,

      confirmLabel: 'Generate Structure',

      tone: 'default'

    });



    if (!confirmed) {

      return;

    }



    const payload = this.buildGeneratePayload(false);

    if (!payload) {

      return;

    }



    this.generating = true;

    this.loader.show();

    this.service.generateStructure(this.selectedSocietyId, payload).subscribe({

      next: (data) => {

        this.preview.set(data);

        this.closeGenerateModal();

        this.successMessage.set(

          `Structure generated: ${data.totalMappings} flat(s) configured. ${data.skippedDuplicates} duplicate(s) skipped.`

        );

        this.loadStructure();

        this.loadSocieties();

        this.generating = false;

        this.loader.hide();

      },

      error: (err) => {

        this.errorMessage.set(err?.error?.message ?? 'Unable to generate the structure. Please try again.');

        this.generating = false;

        this.loader.hide();

      }

    });

  }



  buildGeneratePayload(previewOnly: boolean): GenerateStructureRequest | null {

    const wingIds = [...this.generateWingIds];

    const floorIds = [...this.generateFloorIds];

    const flatIds = [...this.generateFlatIds];



    if (wingIds.length === 0 || floorIds.length === 0 || flatIds.length === 0) {

      this.errorMessage.set('Select at least one wing, floor, and flat.');

      return null;

    }



    return { wingIds, floorIds, flatIds, previewOnly };

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


