import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntityChanges1765516134610 implements MigrationInterface {
    name = 'SyncEntityChanges1765516134610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_project_id"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_inviter_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "assignee_id" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "assigned_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_eb33c4841a61e998a8c906fbcf1" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_1462d5db7be95ebcafc9fcdf2e1" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_1462d5db7be95ebcafc9fcdf2e1"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_eb33c4841a61e998a8c906fbcf1"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "assigned_at"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "assignee_id"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_inviter_id" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
