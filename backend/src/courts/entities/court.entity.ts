import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

const textColumnType = () => {
  if (process.env.DB_TYPE === 'mysql') {
    return 'longtext';
  }
  return 'text';
};

@Entity('Court')
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: textColumnType() as any, nullable: true })
  image?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location?: string;
}
