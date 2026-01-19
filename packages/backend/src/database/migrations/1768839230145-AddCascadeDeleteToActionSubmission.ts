import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToActionSubmission1768839230145 implements MigrationInterface {
    name = 'AddCascadeDeleteToActionSubmission1768839230145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9df1f338afc4fb7ffde6387ec" ON "action_submissions" ("form_request_message_id") WHERE form_request_message_id IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e" FOREIGN KEY ("form_request_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9df1f338afc4fb7ffde6387ec"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_badce0d73c9dc84eb68aa180f8e" FOREIGN KEY ("form_request_message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_80bda7b76f5e2796c6d1a5d7896" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
