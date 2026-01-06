import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastMessageIdToConversations1765611059264 implements MigrationInterface {
    name = 'AddLastMessageIdToConversations1765611059264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "last_message_id" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "last_message_id"`);
    }

}
