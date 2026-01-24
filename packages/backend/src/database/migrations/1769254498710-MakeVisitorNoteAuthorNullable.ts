import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeVisitorNoteAuthorNullable1769254498710 implements MigrationInterface {
    name = 'MakeVisitorNoteAuthorNullable1769254498710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visitor_notes" DROP CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5"`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ALTER COLUMN "author_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ADD CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visitor_notes" DROP CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5"`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ALTER COLUMN "author_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visitor_notes" ADD CONSTRAINT "FK_5bd6afd812753ec5aab21f6c0e5" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
