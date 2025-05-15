export interface DoctorCreateInput {
  specialization: string[];
  qualifications: string[];
}

export interface DoctorUpdateInput {
  specialization?: string[];
  qualifications?: string[];
  ratings?: number;
}