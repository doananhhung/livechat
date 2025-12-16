// src/projects/entities/project-member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique, // Import Unique
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Role } from "./roles.enum"; // Legacy - for backward compatibility
import { ProjectRole } from "./project-roles.enum";

@Entity("project_members")
@Unique(["userId", "projectId"]) // Ensures a user can only be a member of a project once.
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  projectId: number;

  @Column("uuid") // Make sure the type matches the User's id type
  userId: string;

  // Project-specific role (manager or agent)
  @Column({
    type: "enum",
    enum: ProjectRole,
    comment: "The role of the user within this specific project.",
  })
  role: ProjectRole;

  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @ManyToOne(() => User, (user) => user.projectMemberships, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  // Timestamp for when the membership was created.
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // Timestamp for when the membership was last updated.
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
