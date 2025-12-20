import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "email_change_requests" })
export class EmailChangeRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Foreign key column - maps to database column "user_id"
  @Column({ type: "uuid", name: "user_id", nullable: false })
  userId: string;

  // Relation to User entity - uses the same "user_id" column
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  // Maps to database column "old_email"
  @Column({ type: "varchar", name: "old_email", nullable: false })
  oldEmail: string;

  // Maps to database column "new_email"
  @Column({ type: "varchar", name: "new_email", nullable: false })
  newEmail: string;

  // Maps to database column "token"
  @Column({ type: "varchar", name: "token", unique: true, nullable: false })
  token: string;

  // Maps to database column "expires_at"
  @Column({ type: "timestamptz", name: "expires_at", nullable: false })
  expiresAt: Date;

  // Maps to database column "is_verified"
  @Column({
    type: "boolean",
    name: "is_verified",
    default: false,
    nullable: false,
  })
  isVerified: boolean;

  // Maps to database column "is_cancelled"
  @Column({
    type: "boolean",
    name: "is_cancelled",
    default: false,
    nullable: false,
  })
  isCancelled: boolean;

  // Maps to database column "created_at"
  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
