import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToInvitations1760880781597 implements MigrationInterface {
    name = 'AddRoleToInvitations1760880781597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invitations_role_enum" AS ENUM('admin', 'manager', 'agent')`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD "role" "public"."invitations_role_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    }

}
