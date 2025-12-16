import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorRolesToGlobalAndProjectRoles1760896610921
  implements MigrationInterface
{
  name = 'RefactorRolesToGlobalAndProjectRoles1760896610921';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Rename users.roles to role temporarily
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "roles" TO "role"`
    );

    // Step 2: Drop the old text column
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);

    // Step 3: Create new enum type for global roles
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`
    );

    // Step 4: Add new role column with default 'user'
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`
    );

    // Step 5: Update project_members role enum (remove 'admin', keep only manager/agent)
    // First, convert any existing 'admin' to 'manager'
    await queryRunner.query(
      `UPDATE "project_members" SET "role" = 'manager' WHERE "role" = 'admin'`
    );

    await queryRunner.query(
      `ALTER TYPE "public"."project_members_role_enum" RENAME TO "project_members_role_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_members_role_enum" AS ENUM('manager', 'agent')`
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "public"."project_members_role_enum" USING "role"::"text"::"public"."project_members_role_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."project_members_role_enum_old"`
    );

    // Step 6: Update invitations role enum (remove 'admin', keep only manager/agent)
    // First, convert any existing 'admin' to 'manager'
    await queryRunner.query(
      `UPDATE "invitations" SET "role" = 'manager' WHERE "role" = 'admin'`
    );

    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum" RENAME TO "invitations_role_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('manager', 'agent')`
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum" USING "role"::"text"::"public"."invitations_role_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum_old" AS ENUM('admin', 'manager', 'agent')`
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum_old" USING "role"::"text"::"public"."invitations_role_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."invitations_role_enum_old" RENAME TO "invitations_role_enum"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_members_role_enum_old" AS ENUM('admin', 'manager', 'agent')`
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "public"."project_members_role_enum_old" USING "role"::"text"::"public"."project_members_role_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."project_members_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."project_members_role_enum_old" RENAME TO "project_members_role_enum"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" text NOT NULL DEFAULT 'manager'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "role" TO "roles"`
    );
  }
}
