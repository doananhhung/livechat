import { MigrationInterface, QueryRunner } from "typeorm";

export class CretateEmailChangeRequestTableAndChangeRoleDesign1760948029920 implements MigrationInterface {
    name = 'CretateEmailChangeRequestTableAndChangeRoleDesign1760948029920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "roles" TO "role"`);
        await queryRunner.query(`CREATE TABLE "email_change_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "old_email" character varying NOT NULL, "new_email" character varying NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "is_cancelled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_c236de00f1b420644f7b38052c7" UNIQUE ("token"), CONSTRAINT "PK_bd4c3add2b94c4ee2207d9234d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TYPE "public"."project_members_role_enum" RENAME TO "project_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."project_members_role_enum" AS ENUM('manager', 'agent')`);
        await queryRunner.query(`ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "public"."project_members_role_enum" USING "role"::"text"::"public"."project_members_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."project_members_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."invitations_role_enum" RENAME TO "invitations_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."invitations_role_enum" AS ENUM('manager', 'agent')`);
        await queryRunner.query(`ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum" USING "role"::"text"::"public"."invitations_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "email_change_requests" ADD CONSTRAINT "FK_e800aef9e4acf92283f401add9a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_change_requests" DROP CONSTRAINT "FK_e800aef9e4acf92283f401add9a"`);
        await queryRunner.query(`CREATE TYPE "public"."invitations_role_enum_old" AS ENUM('admin', 'manager', 'agent')`);
        await queryRunner.query(`ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "public"."invitations_role_enum_old" USING "role"::"text"::"public"."invitations_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."invitations_role_enum_old" RENAME TO "invitations_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."project_members_role_enum_old" AS ENUM('admin', 'manager', 'agent')`);
        await queryRunner.query(`ALTER TABLE "project_members" ALTER COLUMN "role" TYPE "public"."project_members_role_enum_old" USING "role"::"text"::"public"."project_members_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."project_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."project_members_role_enum_old" RENAME TO "project_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" text NOT NULL DEFAULT 'manager'`);
        await queryRunner.query(`DROP TABLE "email_change_requests"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "role" TO "roles"`);
    }

}
