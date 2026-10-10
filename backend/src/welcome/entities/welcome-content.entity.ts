import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

const textColumnType = () => {
  const dbType = process.env.DB_TYPE || '';
  if (dbType === 'sqlite' || dbType === 'sqljs') {
    return 'text';
  }
  return 'longtext';
};

@Entity('welcome_content')
export class WelcomeContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: textColumnType() as any })
  content_json: string;

  @UpdateDateColumn()
  updated_at: Date;
}
