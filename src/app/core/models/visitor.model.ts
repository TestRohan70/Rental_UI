export type VisitorStatusCode = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export interface VisitorRequest {
  id: number;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  wing?: string;
  flatNo?: string | number;
  residentId: number;
  residentName?: string;
  securityUserId?: number;
  securityUserName?: string;
  createdDate: string;
  respondedDate?: string;
  acknowledgedDate?: string;
  visitorPhotoUrl?: string;
  societyId?: number;
  societyName?: string;
  societyWingFlatConfigId?: number;
  visitType?: string;
  expectedArrivalDateTime?: string;
  otpExpiresAt?: string;
  otpVerifiedAt?: string;
  statusId?: number;
  statusCode?: VisitorStatusCode | string;
  statusName?: string;
  checkInDateTime?: string;
  checkOutDateTime?: string;
}

export interface CreatePlannedVisitorRequest {
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedArrivalDateTime?: string;
}

export interface CreateUnplannedVisitorRequest {
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  societyWingFlatConfigId: number;
}

export interface PlannedVisitorResponse {
  message: string;
  visitorRequestId: number;
  otp: string;
  otpExpiresAt: string;
}

export interface VerifyOtpRequest {
  visitorRequestId: number;
  otp: string;
}

export interface CheckInRequest {
  visitorRequestId: number;
  gate?: string;
}

export interface CheckOutRequest {
  visitorRequestId: number;
}

export interface VisitorVisitResponse {
  id: number;
  visitorRequestId: number;
  visitorName: string;
  wing?: string;
  flatNo?: string;
  checkInDateTime?: string;
  checkOutDateTime?: string;
  checkInSecurityUserId?: number;
  checkInSecurityUserName?: string;
  checkOutSecurityUserId?: number;
  checkOutSecurityUserName?: string;
  gate?: string;
  statusId: number;
  statusCode?: string;
  statusName?: string;
  createdDate: string;
}

export interface ResidentLookup {
  id: number;
  name: string;
  wing: string;
  flatNo: number;
  societyWingFlatConfigId?: number;
  ownershipType?: string;
}

export interface Wing {
  id: number;
  code: string;
  name: string;
}

export interface Floor {
  id: number;
  code: string;
  name: string;
  floorNumber: number;
}

export interface Flat {
  id: number;
  code: string;
}
