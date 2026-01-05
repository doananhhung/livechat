import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConversationStatusEnum1765605059764 implements MigrationInterface {
    name = 'UpdateConversationStatusEnum1765605059764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ALTER TYPE cannot run inside a transaction block
        await queryRunner.commitTransaction();

        try {
            await queryRunner.query(`ALTER TYPE "public"."conversations_status_enum" ADD VALUE IF NOT EXISTS 'solved'`);
            await queryRunner.query(`ALTER TYPE "public"."conversations_status_enum" ADD VALUE IF NOT EXISTS 'spam'`);
        } catch (error) {
            // Re-start transaction before throwing if we want to be safe, but we are failing anyway.
            await queryRunner.startTransaction();
            throw error;
        }

        // Resume transaction for data update
        await queryRunner.startTransaction();
        
        // Migrate data: 'closed' -> 'solved'
        await queryRunner.query(`UPDATE "conversations" SET "status" = 'solved' WHERE "status" = 'closed'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert data: 'solved' -> 'closed'
        await queryRunner.query(`UPDATE "conversations" SET "status" = 'closed' WHERE "status" = 'solved'`);
        
        // NOTE: We cannot remove values from ENUM in Postgres without dropping/recreating the type.
        // We leave 'solved' and 'spam' in the enum but unused.
    }

}