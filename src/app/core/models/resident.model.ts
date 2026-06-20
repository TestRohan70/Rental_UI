export interface Resident {
  id: number;
  society?: string;
  wing: string;
  flatNo: number;
  name: string;
  email: string;
  address?: string;
  parking?: boolean;
  noofParking?: number;
  ownershipType?: string;
  createdDate?: string;
  updatedDate?: string;
  status?: string;
  approvedBy?: number;
}
