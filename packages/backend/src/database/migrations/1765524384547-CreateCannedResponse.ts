import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCannedResponse1765524384547 implements MigrationInterface {
    name = 'CreateCannedResponse1765524384547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "canned_responses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" integer NOT NULL, "shortcut" character varying(50) NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1dd84f4c9ad23c3b77ed6b04943" UNIQUE ("project_id", "shortcut"), CONSTRAINT "PK_1df87c74d99c463b1c7fb30dc14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "canned_responses" ADD CONSTRAINT "FK_85643968ab593e5c42fbd99dd6d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "canned_responses" DROP CONSTRAINT "FK_85643968ab593e5c42fbd99dd6d"`);
        await queryRunner.query(`DROP TABLE "canned_responses"`);
    }

}
