import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Court')
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
