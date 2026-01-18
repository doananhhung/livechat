import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../../database/entities/project.entity";
import { ActionDefinition } from "@live-chat/shared-types";

@Entity("action_templates")
export class ActionTemplate {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "bigint", name: "project_id" })
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb" })
  definition: ActionDefinition;

  @Column({ type: "boolean", default: true, name: "is_enabled" })
  isEnabled: boolean;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
