import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisitorToActionSubmission1766852762233 implements MigrationInterface {
    name = 'AddVisitorToActionSubmission1766852762233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "visitor_id" integer`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD "form_request_message_id" bigint`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_eccee0301c42080b64712ed7e37"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ALTER COLUMN "creator_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "CHK_77b4f195e8ef614edb2c28adbf" CHECK ((creator_id IS NOT NULL AND visitor_id IS NULL) OR (creator_id IS NULL AND visitor_id IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_eccee0301c42080b64712ed7e37" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e" FOREIGN KEY ("form_request_message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_eccee0301c42080b64712ed7e37"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "CHK_77b4f195e8ef614edb2c28adbf"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ALTER COLUMN "creator_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_eccee0301c42080b64712ed7e37" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "form_request_message_id"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP COLUMN "visitor_id"`);
    }

}
