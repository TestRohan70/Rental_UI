export type VisitorRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Acknowledged';

export interface VisitorRequest {
  id: number;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  wing: string;
  flatNo: number;
  residentId: number;
  residentName: string;
  securityId: number;
  securityName: string;
  status: VisitorRequestStatus;
  createdDate: string;
  respondedDate?: string;
  acknowledgedDate?: string;
  visitorPhotoUrl?: string;
}

export interface CreateVisitorRequest {
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  wing: string;
  flatNo: number;
  securityId: number;
}

export interface ResidentLookup {
  id: number;
  name: string;
  wing: string;
  flatNo: number;
  role?: string;
}
