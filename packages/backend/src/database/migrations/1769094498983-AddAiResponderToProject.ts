import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiResponderToProject1769094498983 implements MigrationInterface {
    name = 'AddAiResponderToProject1769094498983'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "ai_responder_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "ai_responder_prompt" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "ai_responder_prompt"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "ai_responder_enabled"`);
    }

}
