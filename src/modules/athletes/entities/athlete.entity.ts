import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DominantHand } from '../enums/dominant-hand.enum';

@Entity('athletes')
export class Athlete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name', nullable: false })
  fullName: string;

  @Column({ type: 'date', name: 'birth_date', nullable: false })
  birthDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: false })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'guardian_name', nullable: true })
  guardianName: string | null;

  @Column({ type: 'varchar', length: 50, name: 'guardian_phone', nullable: true })
  guardianPhone: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'registration_date', default: () => 'now()' })
  registrationDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 11, nullable: true })
  cpf: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'height_cm', nullable: true })
  heightCm: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'weight_kg', nullable: true })
  weightKg: number | null;

  @Column({
    type: 'enum',
    enum: DominantHand,
    name: 'dominant_hand',
    nullable: true,
  })
  dominantHand: DominantHand | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  photo?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
