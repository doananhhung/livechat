import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentTypeToMessage1766852936887 implements MigrationInterface {
    name = 'AddContentTypeToMessage1766852936887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."messages_content_type_enum" AS ENUM('text', 'form_request', 'form_submission')`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "content_type" "public"."messages_content_type_enum" NOT NULL DEFAULT 'text'`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "content_type"`);
        await queryRunner.query(`DROP TYPE "public"."messages_content_type_enum"`);
    }

}
