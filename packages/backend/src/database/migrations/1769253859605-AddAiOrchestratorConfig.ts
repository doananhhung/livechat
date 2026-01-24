import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiOrchestratorConfig1769253859605 implements MigrationInterface {
    name = 'AddAiOrchestratorConfig1769253859605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "ai_mode" character varying NOT NULL DEFAULT 'simple'`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "ai_config" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "ai_config"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "ai_mode"`);
    }

}
