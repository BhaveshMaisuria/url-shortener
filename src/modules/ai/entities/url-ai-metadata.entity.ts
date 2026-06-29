import { Url } from 'src/modules/urls/entities/url.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('url_ai_metadata')
export class UrlAiMetadata {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'jsonb', default: [] })
  tags!: string[];

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => Url, (url) => url.aiMetadata, { onDelete: 'CASCADE' })
  @JoinColumn()
  url!: Url;

  @Column({ type: 'uuid', unique: true })
  urlId!: string;
}
