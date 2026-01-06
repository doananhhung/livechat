import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoResolveMinutesToProjects1765610726351 implements MigrationInterface {
    name = 'AddAutoResolveMinutesToProjects1765610726351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "auto_resolve_minutes" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "auto_resolve_minutes"`);
    }

}
