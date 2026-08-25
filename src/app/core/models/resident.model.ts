export interface Resident {
  id: number;
  society?: string;
  wing: string;
  flatNo: number;
  userName: string;
  email: string;
  address?: string;
  parking?: boolean;
  noofParking?: number;
  ownershipType?: string;
  role?: string;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
  approvedBy?: number;
}
