import { DominantHand } from '../../enums/dominant-hand.enum';

export interface AthleteUpdateData {
  fullName?: string;
  birthDate?: Date;
  phone?: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  isActive?: boolean;
  email?: string;
  cpf?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  dominantHand?: DominantHand | null;
  notes?: string | null;
  photo?: string | null;
}
