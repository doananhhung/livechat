import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVisitorNote1765549215551 implements MigrationInterface {
    name = 'CreateVisitorNote1765549215551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "visitor_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "visitor_id" integer NOT NULL, "author_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3266253c69556fc383c3cd6d989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ADD CONSTRAINT "FK_106e302c4ae6e16c5cc3cf1b928" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ADD CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visitor_notes" DROP CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5"`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" DROP CONSTRAINT "FK_106e302c4ae6e16c5cc3cf1b928"`);
        await queryRunner.query(`DROP TABLE "visitor_notes"`);
    }

}
