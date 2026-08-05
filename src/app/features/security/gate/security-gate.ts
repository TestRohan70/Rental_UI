import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { LoaderService } from '../../../core/services/loader.service';
import { VisitorRequest } from '../../../core/models/visitor.model';
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

  readonly requests = signal<VisitorRequest[]>([]);
  readonly historyRequests = signal<VisitorRequest[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly residentPreview = signal('');
  readonly activeFilter = signal<'all' | 'Pending' | 'Approved'>('all');
  readonly historyFilter = signal<'Approved' | 'Rejected'>('Approved');
  readonly showCamera = signal(false);
  readonly cameraStarting = signal(false);

  wingOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  private cameraStream: MediaStream | null = null;

  form = {
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    wing: '',
    flatNo: null as number | null
  };

  readonly filteredRequests = computed(() => {
    const filter = this.activeFilter();
    const items = this.requests();

    if (filter === 'all') {
      return items;
    }

    return items.filter((item) => item.status === filter);
  });

  readonly pendingCount = computed(() =>
    this.requests().filter((item) => item.status === 'Pending').length
  );

  readonly approvedCount = computed(() =>
    this.requests().filter((item) => item.status === 'Approved').length
  );

  readonly filteredHistory = computed(() => {
    const filter = this.historyFilter();
    return this.historyRequests().filter((item) =>
      filter === 'Approved' ? item.status === 'Acknowledged' : item.status === 'Rejected'
    );
  });

  readonly approvedHistoryCount = computed(() =>
    this.historyRequests().filter((item) => item.status === 'Acknowledged').length
  );

  readonly rejectedHistoryCount = computed(() =>
    this.historyRequests().filter((item) => item.status === 'Rejected').length
  );

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.clearPhotoPreview();
  }

  loadRequests(): void {
    const securityId = this.authService.getUserId();
    if (!securityId) {
      return;
    }

    this.visitorService.getGateRequests(securityId).subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.errorMessage.set('Unable to load gate requests.')
    });

    this.visitorService.getGateRequestHistory(securityId).subscribe({
      next: (data) => this.historyRequests.set(data),
      error: () => this.errorMessage.set('Unable to load request history.')
    });
  }

  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;

  onUnitChange(): void {
    this.residentPreview.set('');

    if (!this.form.wing || !this.form.flatNo) {
      return;
    }

    this.visitorService.lookupResident(this.form.wing, Number(this.form.flatNo)).subscribe({
      next: (resident) => {
        this.residentPreview.set(`${resident.name} · ${resident.role ?? 'Resident'}`);
      },
      error: (error) => {
        const message = error?.error?.message ?? 'No approved Tenant/Owner found for this unit.';
        this.residentPreview.set(message);
      }
    });
  }

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
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
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
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        this.cameraStream = fallbackStream;
        const video = this.cameraVideo?.nativeElement;

        if (!video) {
          this.stopCamera();
          return;
        }

        video.srcObject = fallbackStream;
        await video.play();
        this.cameraStarting.set(false);
      } catch {
        this.cameraStarting.set(false);
        this.errorMessage.set('Unable to access camera. Please allow camera permission.');
        this.closeCamera();
      }
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
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.errorMessage.set('Unable to capture photo. Please try again.');
          return;
        }

        const file = new File([blob], `visitor-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.setPhotoFile(file);
        this.closeCamera();
      },
      'image/jpeg',
      0.92
    );
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

  submitRequest(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const securityId = this.authService.getUserId();
    if (!securityId) {
      return;
    }

    if (!this.form.visitorName.trim() || !this.form.wing || !this.form.flatNo) {
      this.errorMessage.set('Visitor name, wing, and flat number are required.');
      return;
    }

    const formData = new FormData();
    formData.append('visitorName', this.form.visitorName.trim());

    const phone = this.form.visitorPhone.trim();
    if (phone) {
      formData.append('visitorPhone', phone);
    }

    const purpose = this.form.purpose.trim();
    if (purpose) {
      formData.append('purpose', purpose);
    }

    formData.append('wing', this.form.wing);
    formData.append('flatNo', String(this.form.flatNo));
    formData.append('securityId', String(securityId));

    if (this.selectedPhoto) {
      formData.append('visitorPhoto', this.selectedPhoto, this.selectedPhoto.name);
    }

    this.loader.message.set('Sending visitor request...');
    this.loader.subtitle.set('Waiting for resident approval.');

    this.visitorService.createRequest(formData).subscribe({
      next: () => {
        this.successMessage.set('Visitor request sent to resident for approval.');
        this.resetForm();
        this.loadRequests();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Failed to create visitor request.';
        this.errorMessage.set(message);
      }
    });
  }

  private resetForm(): void {
    this.form = {
      visitorName: '',
      visitorPhone: '',
      purpose: '',
      wing: '',
      flatNo: null
    };
    this.residentPreview.set('');
    this.clearPhoto();
  }

  private clearPhotoPreview(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
      this.photoPreviewUrl = null;
    }
  }

  acknowledge(request: VisitorRequest): void {
    const securityId = this.authService.getUserId();
    if (!securityId) {
      return;
    }

    this.loader.message.set('Acknowledging entry...');
    this.loader.subtitle.set('Confirming visitor access at gate.');

    this.visitorService.acknowledge(request.id, securityId).subscribe({
      next: () => {
        this.successMessage.set(`${request.visitorName} entry acknowledged.`);
        this.loadRequests();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Unable to acknowledge request.';
        this.errorMessage.set(message);
      }
    });
  }

  setFilter(filter: 'all' | 'Pending' | 'Approved'): void {
    this.activeFilter.set(filter);
  }

  setHistoryFilter(filter: 'Approved' | 'Rejected'): void {
    this.historyFilter.set(filter);
  }

  historyDate(request: VisitorRequest): string | undefined {
    return request.acknowledgedDate ?? request.respondedDate ?? request.createdDate;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Acknowledged': return 'status-acknowledged';
      default: return '';
    }
  }
}
