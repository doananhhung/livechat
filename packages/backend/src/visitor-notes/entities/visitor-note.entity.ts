import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Visitor } from '../../visitors/entities/visitor.entity';
import { User } from '../../users/entities/user.entity';

@Entity('visitor_notes')
export class VisitorNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  visitorId: number;

  @ManyToOne(() => Visitor, (visitor) => visitor.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitor_id' })
  visitor: Visitor;

  @Column({ type: 'uuid', nullable: true })
  authorId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
