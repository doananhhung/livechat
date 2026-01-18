import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActionTables1766826642219 implements MigrationInterface {
    name = 'CreateActionTables1766826642219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_project_id"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_inviter_id"`);
        await queryRunner.query(`CREATE TABLE "action_templates" ("id" SERIAL NOT NULL, "project_id" integer NOT NULL, "name" character varying(100) NOT NULL, "description" text, "definition" jsonb NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_254a8b8a41eff4d0dea324534fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."action_submissions_status_enum" AS ENUM('submitted', 'processing', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "action_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" integer NOT NULL, "conversation_id" bigint NOT NULL, "creator_id" uuid NOT NULL, "data" jsonb NOT NULL, "status" "public"."action_submissions_status_enum" NOT NULL DEFAULT 'submitted', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0c189300e98ca0cab42e6a86693" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "action_templates" ADD CONSTRAINT "FK_78e170a50bc97b14d0dac070bdd" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_d4bfeef9ab752ad54a6f5a77f96" FOREIGN KEY ("template_id") REFERENCES "action_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_submissions" ADD CONSTRAINT "FK_eccee0301c42080b64712ed7e37" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_eccee0301c42080b64712ed7e37"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_5f77c86e0e4d1c308fb78d255c4"`);
        await queryRunner.query(`ALTER TABLE "action_submissions" DROP CONSTRAINT "FK_d4bfeef9ab752ad54a6f5a77f96"`);
        await queryRunner.query(`ALTER TABLE "action_templates" DROP CONSTRAINT "FK_78e170a50bc97b14d0dac070bdd"`);
        await queryRunner.query(`DROP TABLE "action_submissions"`);
        await queryRunner.query(`DROP TYPE "public"."action_submissions_status_enum"`);
        await queryRunner.query(`DROP TABLE "action_templates"`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_inviter_id" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
