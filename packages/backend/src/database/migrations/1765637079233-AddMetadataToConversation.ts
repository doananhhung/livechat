import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataToConversation1765637079233 implements MigrationInterface {
    name = 'AddMetadataToConversation1765637079233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "metadata"`);
    }

}
