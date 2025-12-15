import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsEmailVerifiedToUser1760795293945 implements MigrationInterface {
    name = 'AddIsEmailVerifiedToUser1760795293945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_verified"`);
    }

}
