import { Url } from 'src/modules/urls/entities/url.entity';
import {
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Entity,
  Index,
} from 'typeorm';

@Entity('url_analytics')
@Index(['urlId', 'clickedAt'])
export class UrlAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  referer!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  clickedAt!: Date;

  @ManyToOne(() => Url, (url) => url.analytics, { onDelete: 'CASCADE' })
  url!: Url;

  @Column({ type: 'uuid' })
  urlId!: string;
}
