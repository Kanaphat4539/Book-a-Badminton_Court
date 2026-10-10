import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

const textColumnType = () => {
  if (process.env.DB_TYPE === 'mysql') {
    return 'longtext';
  }
  return 'text';
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
