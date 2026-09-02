import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { LoaderService } from '../../../core/services/loader.service';
import { Flat, Floor, VisitorRequest, Wing } from '../../../core/models/visitor.model';
import { getVisitorPhotoUrl } from '../../../core/utils/visitor-photo.util';

@Component({
  selector: 'app-security-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-gate.html',
  styleUrl: './security-gate.css'
})
export class SecurityGate implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly visitorService = inject(VisitorService);
  readonly loader = inject(LoaderService);

  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;

  readonly activeTab = signal<'unplanned' | 'verify' | 'inside' | 'history'>('unplanned');
  readonly requests = signal<VisitorRequest[]>([]);
  readonly currentlyInside = signal<VisitorRequest[]>([]);
  readonly historyRequests = signal<VisitorRequest[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly residentPreview = signal('');
  readonly showCamera = signal(false);
  readonly cameraStarting = signal(false);

  // Dynamic dropdown signals
  readonly wings = signal<Wing[]>([]);
  readonly floors = signal<Floor[]>([]);
  readonly flats = signal<Flat[]>([]);

  // OTP Verification state
  otpForm = {
    visitorRequestId: null as number | null,
    otp: ''
  };
  otpVerifiedSuccess = signal(false);
  otpVerifiedRequestId = signal<number | null>(null);

  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  private cameraStream: MediaStream | null = null;

  form = {
    wingId: null as number | null,
    floorId: null as number | null,
    flatId: null as number | null,
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    societyWingFlatConfigId: null as number | null
  };

  ngOnInit(): void {
    this.loadAllData();
    this.loadWings();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.clearPhotoPreview();
  }

  loadAllData(): void {
    this.loadGateRequests();
    this.loadCurrentlyInside();
    this.loadSocietyHistory();
  }

  loadWings(): void {
    this.visitorService.getWings().subscribe({
      next: (data) => this.wings.set(data),
      error: () => this.errorMessage.set('Unable to load society wings.')
    });
  }

  onWingChange(): void {
    this.form.floorId = null;
    this.form.flatId = null;
    this.form.societyWingFlatConfigId = null;
    this.floors.set([]);
    this.flats.set([]);
    this.residentPreview.set('');

    if (!this.form.wingId) {
      return;
    }

    this.visitorService.getFloors(this.form.wingId).subscribe({
      next: (data) => {
        this.floors.set(data);
        if (data.length === 0) {
          this.residentPreview.set('No floors configured for this wing.');
        }
      },
      error: () => this.errorMessage.set('Unable to load floors for selected wing.')
    });
  }

  onFloorChange(): void {
    this.form.flatId = null;
    this.form.societyWingFlatConfigId = null;
    this.flats.set([]);
    this.residentPreview.set('');

    if (!this.form.wingId || !this.form.floorId) {
      return;
    }

    this.visitorService.getFlats(this.form.wingId, this.form.floorId).subscribe({
      next: (data) => {
        this.flats.set(data);
        if (data.length === 0) {
          this.residentPreview.set('No flats configured for this floor.');
        }
      },
      error: () => this.errorMessage.set('Unable to load flats for selected floor.')
    });
  }

  onFlatChange(): void {
    this.residentPreview.set('');
    this.form.societyWingFlatConfigId = null;

    if (!this.form.wingId || !this.form.floorId || !this.form.flatId) {
      return;
    }

    this.visitorService.lookupResidentByConfig(this.form.wingId, this.form.floorId, this.form.flatId).subscribe({
      next: (resident) => {
        this.residentPreview.set(`${resident.name} · Wing ${resident.wing} Flat ${resident.flatNo}`);
        if (resident.societyWingFlatConfigId) {
          this.form.societyWingFlatConfigId = resident.societyWingFlatConfigId;
        }
      },
      error: (error) => {
        const message = error?.error?.message ?? 'No approved resident found for this unit.';
        this.residentPreview.set(message);
      }
    });
  }

  loadGateRequests(): void {
    this.visitorService.getGateRequests().subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.errorMessage.set('Unable to load gate requests.')
    });
  }

  loadCurrentlyInside(): void {
    this.visitorService.getCurrentlyInside().subscribe({
      next: (data) => this.currentlyInside.set(data),
      error: () => this.errorMessage.set('Unable to load currently inside list.')
    });
  }

  loadSocietyHistory(): void {
    this.visitorService.getSocietyHistory().subscribe({
      next: (data) => this.historyRequests.set(data),
      error: () => this.errorMessage.set('Unable to load society history.')
    });
  }

  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;

  openCamera(): void {
    this.errorMessage.set('');
    this.showCamera.set(true);
    this.cameraStarting.set(true);

    setTimeout(() => {
      void this.startCamera();
    }, 0);
  }

  closeCamera(): void {
    this.stopCamera();
    this.showCamera.set(false);
    this.cameraStarting.set(false);
  }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraStarting.set(false);
      this.errorMessage.set('Camera is not supported in this browser.');
      this.closeCamera();
      return;
    }

    try {
      this.stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      this.cameraStream = stream;
      const video = this.cameraVideo?.nativeElement;
      if (!video) {
        this.stopCamera();
        return;
      }
      video.srcObject = stream;
      await video.play();
      this.cameraStarting.set(false);
    } catch {
      this.cameraStarting.set(false);
      this.errorMessage.set('Unable to access camera. Please allow camera permission.');
      this.closeCamera();
    }
  }

  captureFromCamera(): void {
    const video = this.cameraVideo?.nativeElement;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `visitor-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.setPhotoFile(file);
        this.closeCamera();
      },
      'image/jpeg',
      0.92
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setPhotoFile(input.files[0]);
    }
  }

  clearPhoto(): void {
    this.clearPhotoPreview();
    this.selectedPhoto = null;
  }

  private setPhotoFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Photo must be 5 MB or smaller.');
      return;
    }
    this.errorMessage.set('');
    this.clearPhotoPreview();
    this.selectedPhoto = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
  }

  private stopCamera(): void {
    this.cameraStream?.getTracks().forEach((track) => track.stop());
    this.cameraStream = null;
    const video = this.cameraVideo?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  submitUnplannedRequest(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.form.visitorName.trim() || !this.form.wingId || !this.form.floorId || !this.form.flatId) {
      this.errorMessage.set('Visitor name, wing, floor, and flat selection are required.');
      return;
    }

    if (!this.form.societyWingFlatConfigId) {
      this.errorMessage.set('No active resident configuration resolved for this unit in your society.');
      return;
    }

    const formData = new FormData();
    formData.append('visitorName', this.form.visitorName.trim());
    if (this.form.visitorPhone.trim()) formData.append('visitorPhone', this.form.visitorPhone.trim());
    if (this.form.purpose.trim()) formData.append('purpose', this.form.purpose.trim());
    formData.append('societyWingFlatConfigId', String(this.form.societyWingFlatConfigId));

    if (this.selectedPhoto) {
      formData.append('visitorPhoto', this.selectedPhoto, this.selectedPhoto.name);
    }

    this.loader.message.set('Sending unplanned visitor request...');
    this.loader.subtitle.set('Waiting for resident approval.');

    this.visitorService.createUnplannedVisitor(formData).subscribe({
      next: () => {
        this.successMessage.set('Unplanned visitor request sent to resident for approval.');
        this.resetForm();
        this.loadAllData();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Failed to create unplanned visitor request.';
        this.errorMessage.set(message);
      }
    });
  }

  verifyOtp(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.otpVerifiedSuccess.set(false);

    if (!this.otpForm.visitorRequestId || !this.otpForm.otp.trim()) {
      this.errorMessage.set('Select a visitor request and enter the 6-digit OTP.');
      return;
    }

    this.loader.message.set('Verifying 6-digit OTP...');

    this.visitorService.verifyOtp({
      visitorRequestId: Number(this.otpForm.visitorRequestId),
      otp: this.otpForm.otp.trim()
    }).subscribe({
      next: () => {
        this.otpVerifiedSuccess.set(true);
        this.otpVerifiedRequestId.set(Number(this.otpForm.visitorRequestId));
        this.successMessage.set('OTP verified successfully! Visitor is ready for check-in.');
        this.loadAllData();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Invalid or expired OTP.';
        this.errorMessage.set(msg);
      }
    });
  }

  checkIn(requestId: number): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set('Checking in visitor...');

    this.visitorService.checkIn(requestId).subscribe({
      next: () => {
        this.successMessage.set('Visitor checked in successfully.');
        this.otpVerifiedSuccess.set(false);
        this.otpVerifiedRequestId.set(null);
        this.loadAllData();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Check-in failed.';
        this.errorMessage.set(msg);
      }
    });
  }

  checkOut(requestId: number): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set('Checking out visitor...');

    this.visitorService.checkOut(requestId).subscribe({
      next: () => {
        this.successMessage.set('Visitor checked out successfully.');
        this.loadAllData();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Check-out failed.';
        this.errorMessage.set(msg);
      }
    });
  }

  private resetForm(): void {
    this.form = {
      wingId: null,
      floorId: null,
      flatId: null,
      visitorName: '',
      visitorPhone: '',
      purpose: '',
      societyWingFlatConfigId: null
    };
    this.floors.set([]);
    this.flats.set([]);
    this.residentPreview.set('');
    this.clearPhoto();
  }

  private clearPhotoPreview(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
      this.photoPreviewUrl = null;
    }
  }

  statusClass(statusCode?: string): string {
    switch (statusCode?.toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CHECKED_IN': return 'status-checkedin';
      case 'CHECKED_OUT': return 'status-checkedout';
      case 'CANCELLED': return 'status-cancelled';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-default';
    }
  }
}
