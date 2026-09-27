import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreatePmAdminAccountPayload,
  FlatItem,
  FloorItem,
  PmAdminAccountItem,
  SocietyConfigurationService,
  SocietyStructure,
  SocietySummary,
  WingItem
} from '../../../core/services/society-configuration.service';
import { WingConfigurationService } from '../../../core/services/wing-configuration.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

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
  private readonly wingService = inject(WingConfigurationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loader = inject(LoaderService);

  readonly societies = signal<SocietySummary[]>([]);
  readonly structure = signal<SocietyStructure | null>(null);
  readonly societyWings = signal<WingItem[]>([]);
  readonly masterWings = signal<WingItem[]>([]);
  readonly masterFloors = signal<FloorItem[]>([]);
  readonly masterFlats = signal<FlatItem[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  searchTerm = '';
  viewMode: 'list' | 'configure' = 'list';
  selectedSocietyId: number | null = null;
  readonly selectedSociety = signal<SocietySummary | null>(null);

  // Accordion state (Admin Config open by default)
  openSections: Record<'admin' | 'wing' | 'floor' | 'flat', boolean> = {
    admin: true,
    wing: false,
    floor: false,
    flat: false
  };

  // ── 1. Create/Edit Society Modal State (List view) ──
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

  // ── 2. Admin Config Form State ──
  adminForm = {
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    isActive: true
  };
  adminFormErrors: Record<string, string> = {};
  showAdminPassword = false;
  showAdminConfirmPassword = false;
  savingAdmin = false;
  readonly adminAccounts = signal<PmAdminAccountItem[]>([]);
  loadingAdmins = false;

  // ── 3. Wing Config Form State ──
  wingForm = {
    name: '',
    code: '',
    isActive: true
  };
  wingFormErrors: Record<string, string> = {};
  savingWing = false;

  // ── 4. Floor Config Form State ──
  floorForm = {
    wingId: null as number | null,
    name: '',
    floorNumber: null as number | null
  };
  floorFormErrors: Record<string, string> = {};
  savingFloor = false;

  // ── 5. Flat Config Form State ──
  flatForm = {
    wingId: null as number | null,
    floorId: null as number | null,
    flatNumber: '',
    flatType: ''
  };
  flatFormErrors: Record<string, string> = {};
  savingFlat = false;

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phonePattern = /^[0-9+()\-\s]{7,15}$/;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idStr = params.get('id');
      if (idStr) {
        const id = Number(idStr);
        if (!isNaN(id) && id > 0) {
          this.initConfigureMode(id);
          return;
        }
      }

      // Check query parameter fallback (?id= or ?societyId=)
      const qId = this.route.snapshot.queryParams['societyId'] ?? this.route.snapshot.queryParams['id'];
      if (qId) {
        const id = Number(qId);
        if (!isNaN(id) && id > 0) {
          this.initConfigureMode(id);
          return;
        }
      }

      // Default: list view
      this.viewMode = 'list';
      this.selectedSocietyId = null;
      this.selectedSociety.set(null);
      this.loadSocieties();
    });
  }

  toggleSection(section: 'admin' | 'wing' | 'floor' | 'flat'): void {
    this.openSections[section] = !this.openSections[section];
  }

  initConfigureMode(societyId: number): void {
    this.selectedSocietyId = societyId;
    this.service.currentSocietyId = societyId;
    try {
      sessionStorage.setItem('selectedSocietyId', String(societyId));
      sessionStorage.setItem('currentSocietyId', String(societyId));
    } catch {}
    this.viewMode = 'configure';
    this.loadSocietyDetails(societyId);
    this.loadAdminAccounts(societyId);
    this.loadSocietyWings(societyId);
    this.loadMasterData();
    this.loadStructure();
  }

  loadSocietyWings(societyId: number): void {
    this.wingService.getWings(societyId).subscribe({
      next: (wings) => {
        this.societyWings.set(wings || []);
        this.masterWings.set(wings || []);
      },
      error: () => {}
    });
  }

  get displayWings(): WingItem[] {
    const wingsMap = new Map<number, WingItem>();

    for (const w of this.societyWings()) {
      wingsMap.set(w.id, w);
    }

    const structWings = this.structure()?.wings;
    if (structWings) {
      for (const sw of structWings) {
        if (sw.wing && !wingsMap.has(sw.wing.id)) {
          wingsMap.set(sw.wing.id, sw.wing);
        }
      }
    }

    return Array.from(wingsMap.values());
  }

  loadSocietyDetails(societyId: number): void {
    this.service.getSociety(societyId).subscribe({
      next: (data) => this.selectedSociety.set(data),
      error: () => {
        const found = this.societies().find((s) => s.id === societyId);
        if (found) {
          this.selectedSociety.set(found);
        }
      }
    });
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

  configureSociety(society: SocietySummary): void {
    void this.router.navigate(['/padmin/society-configuration', society.id]);
  }

  backToList(): void {
    void this.router.navigate(['/padmin/society-configuration']);
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // ────────────────── 1. Create/Edit Society Modal Methods ──────────────────

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
          this.societyForm.spcs = [
            {
              name: spcRaw.Name ?? spcRaw.name ?? '',
              designation: spcRaw.Designation ?? spcRaw.designation ?? '',
              contact: spcRaw.Contact ?? spcRaw.contact ?? ''
            }
          ];
        } else {
          this.societyForm.spcs = [{ name: '', designation: '', contact: '' }];
        }
      },
      error: () => {
        // Fallback to basic details
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

  // ────────────────── 2. Admin Config Methods ──────────────────

  toggleAdminPassword(): void {
    this.showAdminPassword = !this.showAdminPassword;
  }

  toggleAdminConfirmPassword(): void {
    this.showAdminConfirmPassword = !this.showAdminConfirmPassword;
  }

  resetAdminForm(): void {
    this.adminForm = {
      name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      confirmPassword: '',
      isActive: true
    };
    this.adminFormErrors = {};
  }

  validateAdminForm(): boolean {
    this.adminFormErrors = {};
    let valid = true;

    if (!this.adminForm.name.trim()) {
      this.adminFormErrors['name'] = 'Name is required.';
      valid = false;
    }

    if (!this.adminForm.email.trim()) {
      this.adminFormErrors['email'] = 'Email is required.';
      valid = false;
    } else if (!this.emailPattern.test(this.adminForm.email.trim())) {
      this.adminFormErrors['email'] = 'Enter a valid email address.';
      valid = false;
    }

    if (!this.adminForm.phone.trim()) {
      this.adminFormErrors['phone'] = 'Phone is required.';
      valid = false;
    } else if (!this.phonePattern.test(this.adminForm.phone.trim())) {
      this.adminFormErrors['phone'] = 'Enter a valid phone number.';
      valid = false;
    }

    if (!this.adminForm.username.trim()) {
      this.adminFormErrors['username'] = 'Username is required.';
      valid = false;
    }

    if (!this.adminForm.password) {
      this.adminFormErrors['password'] = 'Password is required.';
      valid = false;
    } else if (this.adminForm.password.length < 6) {
      this.adminFormErrors['password'] = 'Password must be at least 6 characters.';
      valid = false;
    }

    if (!this.adminForm.confirmPassword) {
      this.adminFormErrors['confirmPassword'] = 'Confirm Password is required.';
      valid = false;
    } else if (this.adminForm.confirmPassword !== this.adminForm.password) {
      this.adminFormErrors['confirmPassword'] = 'Passwords do not match.';
      valid = false;
    }

    return valid;
  }

  saveAdmin(): void {
    if (!this.validateAdminForm() || !this.selectedSocietyId) {
      return;
    }

    this.savingAdmin = true;
    this.loader.show();
    this.clearMessages();

    const payload: CreatePmAdminAccountPayload = {
      societyID: this.selectedSocietyId,
      name: this.adminForm.name.trim(),
      email: this.adminForm.email.trim(),
      phone: this.adminForm.phone.trim(),
      username: this.adminForm.username.trim(),
      password: this.adminForm.password
    };

    this.service.createPmAdminAccount(payload).subscribe({
      next: (res) => {
        this.loader.hide();
        this.savingAdmin = false;
        this.successMessage.set(res?.message ?? 'Admin account created successfully.');
        this.adminAccounts.update((list) => [
          ...list,
          {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            username: payload.username,
            isActive: this.adminForm.isActive,
            societyID: this.selectedSocietyId!
          }
        ]);
        this.resetAdminForm();
        this.loadAdminAccounts(this.selectedSocietyId!);
      },
      error: (err) => {
        this.loader.hide();
        this.savingAdmin = false;
        if (err?.status === 404) {
          // Attempt fallback to existing society-admin endpoint if available
          this.service
            .createSocietyAdmin(this.selectedSocietyId!, {
              userName: payload.username,
              email: payload.email,
              password: payload.password
            })
            .subscribe({
              next: (fbRes) => {
                this.successMessage.set(fbRes?.message ?? 'Society Admin created successfully.');
                this.adminAccounts.update((list) => [
                  ...list,
                  {
                    name: payload.name,
                    email: payload.email,
                    phone: payload.phone,
                    username: payload.username,
                    isActive: this.adminForm.isActive,
                    societyID: this.selectedSocietyId!
                  }
                ]);
                this.resetAdminForm();
              },
              error: () => {
                this.errorMessage.set(
                  'POST /api/PmAdminAccount returned 404: Endpoint not found on backend.'
                );
              }
            });
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Unable to save admin account. Please try again.');
        }
      }
    });
  }

  loadAdminAccounts(societyId: number): void {
    this.loadingAdmins = true;
    this.service.getPmAdminAccounts(societyId).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.adminAccounts.set(data);
        }
        this.loadingAdmins = false;
      },
      error: () => {
        this.loadingAdmins = false;
      }
    });
  }

  // ────────────────── 3. Wing Config Methods ──────────────────

  validateWingForm(): boolean {
    this.wingFormErrors = {};
    let valid = true;
    if (!this.wingForm.name.trim()) {
      this.wingFormErrors['name'] = 'Wing Name is required.';
      valid = false;
    }
    if (!this.wingForm.code.trim()) {
      this.wingFormErrors['code'] = 'Wing Code is required.';
      valid = false;
    }
    return valid;
  }

  addWing(): void {
    if (!this.selectedSocietyId || this.selectedSocietyId <= 0) {
      this.errorMessage.set('Society is required.');
      return;
    }

    if (!this.validateWingForm()) {
      return;
    }

    this.savingWing = true;
    this.loader.show();
    this.clearMessages();

    this.wingService
      .createWing({
        societyID: this.selectedSocietyId,
        name: this.wingForm.name.trim(),
        code: this.wingForm.code.trim().toUpperCase(),
        isActive: this.wingForm.isActive
      })
      .subscribe({
        next: (newWing) => {
          this.loader.hide();
          this.savingWing = false;
          this.successMessage.set(`Wing "${newWing.name}" added successfully.`);
          this.wingForm = { name: '', code: '', isActive: true };

          if (newWing) {
            this.societyWings.update((list) => {
              const exists = list.some(
                (w) => w.id === newWing.id || (w.code && w.code.toUpperCase() === newWing.code.toUpperCase())
              );
              return exists ? list : [newWing, ...list];
            });
            this.masterWings.update((list) => {
              const exists = list.some((w) => w.id === newWing.id);
              return exists ? list : [newWing, ...list];
            });
          }

          if (this.selectedSocietyId) {
            this.loadSocietyWings(this.selectedSocietyId);
          }
          this.loadMasterData();
          this.loadStructure();
        },
        error: (err) => {
          this.loader.hide();
          this.savingWing = false;
          this.errorMessage.set(err?.error?.message ?? 'Unable to add wing. Please try again.');
        }
      });
  }

  // ────────────────── 4. Floor Config Methods ──────────────────

  validateFloorForm(): boolean {
    this.floorFormErrors = {};
    let valid = true;
    if (!this.floorForm.wingId) {
      this.floorFormErrors['wingId'] = 'Please select a wing.';
      valid = false;
    }
    if (!this.floorForm.name.trim()) {
      this.floorFormErrors['name'] = 'Floor Name is required.';
      valid = false;
    }
    if (this.floorForm.floorNumber === null || isNaN(Number(this.floorForm.floorNumber))) {
      this.floorFormErrors['floorNumber'] = 'Valid Floor Number is required.';
      valid = false;
    }
    return valid;
  }

  addFloor(): void {
    if (!this.validateFloorForm() || !this.selectedSocietyId) {
      return;
    }

    this.savingFloor = true;
    this.loader.show();
    this.clearMessages();

    this.service
      .createFloor({
        societyId: this.selectedSocietyId,
        wingId: this.floorForm.wingId!,
        name: this.floorForm.name.trim(),
        floorNumber: Number(this.floorForm.floorNumber)
      })
      .subscribe({
        next: (res) => {
          this.loader.hide();
          this.savingFloor = false;
          this.successMessage.set(`Floor "${res.name ?? this.floorForm.name}" added successfully.`);
          this.floorForm.name = '';
          this.floorForm.floorNumber = null;
          this.loadStructure();
        },
        error: (err) => {
          this.loader.hide();
          this.savingFloor = false;
          if (err?.status === 404) {
            this.errorMessage.set(
              'Floor creation endpoint (POST /api/padmin/masters/floors) is not implemented on backend.'
            );
          } else {
            this.errorMessage.set(err?.error?.message ?? 'Unable to add floor. Please try again.');
          }
        }
      });
  }

  // ────────────────── 5. Flat Config Methods ──────────────────

  getFloorsForSelectedFlatWing(): FloorItem[] {
    if (!this.flatForm.wingId) return [];
    const wingNode = this.structure()?.wings.find((w) => w.wing.id === this.flatForm.wingId);
    if (wingNode && wingNode.floors.length > 0) {
      return wingNode.floors.map((f) => f.floor);
    }
    return this.masterFloors();
  }

  onFlatWingChange(wingId: number | null): void {
    this.flatForm.wingId = wingId;
    this.flatForm.floorId = null;
    if (wingId) {
      this.loadFloorsForWing(wingId);
    }
  }

  validateFlatForm(): boolean {
    this.flatFormErrors = {};
    let valid = true;
    if (!this.flatForm.wingId) {
      this.flatFormErrors['wingId'] = 'Please select a wing.';
      valid = false;
    }
    if (!this.flatForm.floorId) {
      this.flatFormErrors['floorId'] = 'Please select a floor.';
      valid = false;
    }
    if (!this.flatForm.flatNumber.trim()) {
      this.flatFormErrors['flatNumber'] = 'Flat Number is required.';
      valid = false;
    }
    return valid;
  }

  addFlat(): void {
    if (!this.validateFlatForm() || !this.selectedSocietyId) {
      return;
    }

    this.savingFlat = true;
    this.loader.show();
    this.clearMessages();

    const existingMaster = this.masterFlats().find(
      (f) => f.code.toLowerCase() === this.flatForm.flatNumber.trim().toLowerCase()
    );

    if (existingMaster) {
      this.service
        .addMapping(this.selectedSocietyId, {
          wingId: this.flatForm.wingId!,
          floorId: this.flatForm.floorId!,
          flatId: existingMaster.id
        })
        .subscribe({
          next: () => {
            this.loader.hide();
            this.savingFlat = false;
            this.successMessage.set(`Flat ${existingMaster.code} added to structure successfully.`);
            this.flatForm.flatNumber = '';
            this.flatForm.flatType = '';
            this.loadStructure();
          },
          error: (err) => {
            this.loader.hide();
            this.savingFlat = false;
            this.errorMessage.set(err?.error?.message ?? 'Unable to add flat. Please try again.');
          }
        });
    } else {
      this.service
        .createFlat({
          societyId: this.selectedSocietyId,
          wingId: this.flatForm.wingId!,
          floorId: this.flatForm.floorId!,
          code: this.flatForm.flatNumber.trim(),
          typeName: this.flatForm.flatType.trim() || undefined
        })
        .subscribe({
          next: (newFlat) => {
            this.service
              .addMapping(this.selectedSocietyId!, {
                wingId: this.flatForm.wingId!,
                floorId: this.flatForm.floorId!,
                flatId: newFlat.id
              })
              .subscribe({
                next: () => {
                  this.loader.hide();
                  this.savingFlat = false;
                  this.successMessage.set(`Flat ${newFlat.code} added successfully.`);
                  this.flatForm.flatNumber = '';
                  this.flatForm.flatType = '';
                  this.loadStructure();
                  this.loadMasterData();
                },
                error: () => {
                  this.loader.hide();
                  this.savingFlat = false;
                  this.loadStructure();
                }
              });
          },
          error: (err) => {
            this.loader.hide();
            this.savingFlat = false;
            if (err?.status === 404) {
              this.errorMessage.set(
                'Flat creation endpoint (POST /api/padmin/masters/flats) is not implemented on backend.'
              );
            } else {
              this.errorMessage.set(err?.error?.message ?? 'Unable to add flat. Please try again.');
            }
          }
        });
    }
  }

  // ────────────────── Structure & Master Loading ──────────────────

  loadMasterData(): void {
    if (this.selectedSocietyId && this.selectedSocietyId > 0) {
      this.wingService.getWings(this.selectedSocietyId).subscribe({
        next: (wings) => this.masterWings.set(wings),
        error: () => {}
      });
    } else {
      this.service.getMasterWings().subscribe({
        next: (wings) => this.masterWings.set(wings),
        error: () => {}
      });
    }

    this.service.getMasterFlats().subscribe({
      next: (flats) => this.masterFlats.set(flats),
      error: () => {}
    });
  }

  loadFloorsForWing(wingId: number | null): void {
    if (!wingId) {
      this.masterFloors.set([]);
      return;
    }

    this.service.getMasterFloors(wingId).subscribe({
      next: (floors) => this.masterFloors.set(floors),
      error: () => {}
    });
  }

  loadStructure(): void {
    if (!this.selectedSocietyId) {
      return;
    }

    this.loader.show();
    this.service.getStructure(this.selectedSocietyId).subscribe({
      next: (data) => {
        this.structure.set(data);
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        // Structure may be empty if not configured yet
      }
    });
  }

  async deleteWing(wing: WingItem): Promise<void> {
    if (!this.selectedSocietyId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete wing?',
      message: `Are you sure you want to delete wing "${wing.name}"?`,
      confirmLabel: 'Delete Wing',
      tone: 'danger'
    });

    if (!confirmed) return;

    this.loader.show();
    this.wingService.deleteWing(wing.id).subscribe({
      next: () => {
        this.loader.hide();
        this.successMessage.set(`Wing "${wing.name}" deleted successfully.`);
        if (this.selectedSocietyId) {
          this.loadSocietyWings(this.selectedSocietyId);
        }
        this.loadStructure();
      },
      error: () => {
        this.service.deactivateWing(this.selectedSocietyId!, wing.id).subscribe({
          next: () => {
            this.loader.hide();
            this.successMessage.set(`Wing "${wing.name}" removed from structure.`);
            if (this.selectedSocietyId) {
              this.loadSocietyWings(this.selectedSocietyId);
            }
            this.loadStructure();
          },
          error: (err) => {
            this.loader.hide();
            this.errorMessage.set(err?.error?.message ?? 'Unable to delete wing.');
          }
        });
      }
    });
  }

  async deactivateWing(wingId: number): Promise<void> {
    if (!this.selectedSocietyId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove wing from structure?',
      message: 'This will remove all floors and flats configured under this wing for this society.',
      confirmLabel: 'Remove Wing',
      tone: 'danger'
    });

    if (!confirmed) return;

    this.service.deactivateWing(this.selectedSocietyId, wingId).subscribe({
      next: () => {
        this.successMessage.set('Wing removed from the structure.');
        this.loadStructure();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove wing.')
    });
  }

  async deactivateFloor(wingId: number, floorId: number): Promise<void> {
    if (!this.selectedSocietyId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove floor from structure?',
      message: 'This will remove all flats configured on this floor for this wing.',
      confirmLabel: 'Remove Floor',
      tone: 'danger'
    });

    if (!confirmed) return;

    this.service.deactivateFloor(this.selectedSocietyId, wingId, floorId).subscribe({
      next: () => {
        this.successMessage.set('Floor removed from the structure.');
        this.loadStructure();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove floor.')
    });
  }

  async deactivateFlat(wingId: number, floorId: number, flatId: number): Promise<void> {
    if (!this.selectedSocietyId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove flat from structure?',
      message: 'This flat will no longer be part of this society configuration.',
      confirmLabel: 'Remove Flat',
      tone: 'danger'
    });

    if (!confirmed) return;

    this.service.deactivateFlat(this.selectedSocietyId, wingId, floorId, flatId).subscribe({
      next: () => {
        this.successMessage.set('Flat removed from the structure.');
        this.loadStructure();
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Unable to remove flat.')
    });
  }
}
