import { UrlAiMetadata } from '../../ai/entities/url-ai-metadata.entity';
import { UrlAnalytics } from '../../analytics/entities/url-analytics.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  originalUrl: string;

  @Index()
  @Column({ type: 'varchar', length: 10, unique: true })
  shortCode: string;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.urls, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @OneToMany(() => UrlAnalytics, (analytics) => analytics.url)
  analytics!: UrlAnalytics[];

  @OneToOne(() => UrlAiMetadata, (aiMetadata) => aiMetadata.url)
  aiMetadata!: UrlAiMetadata;
}
