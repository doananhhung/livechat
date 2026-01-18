import { MigrationInterface, QueryRunner } from "typeorm";

export class FixActionSubmissionTimestampTz1766844828873 implements MigrationInterface {
    name = 'FixActionSubmissionTimestampTz1766844828873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
