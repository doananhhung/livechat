import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectIdToAuditLog1765521915251 implements MigrationInterface {
    name = 'AddProjectIdToAuditLog1765521915251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "webhook_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" integer NOT NULL, "url" character varying NOT NULL, "secret" character varying NOT NULL, "event_triggers" text array NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf631ae77d39849d599817fb6f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7536ac8ded802c28bcf5ad713f" ON "webhook_subscriptions" ("project_id") `);
        await queryRunner.query(`CREATE TYPE "public"."webhook_deliveries_status_enum" AS ENUM('SUCCESS', 'FAILURE', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" uuid NOT NULL, "event_id" character varying NOT NULL, "status" "public"."webhook_deliveries_status_enum" NOT NULL DEFAULT 'PENDING', "request_payload" jsonb NOT NULL, "response_status" integer, "error" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "subscriptionId" uuid, CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" integer, "actor_id" character varying, "actor_type" character varying NOT NULL, "ip_address" character varying, "user_agent" character varying, "action" character varying NOT NULL, "entity" character varying NOT NULL, "entity_id" character varying NOT NULL, "metadata" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5e124016d61fe935a7f10ac3fa" ON "audit_logs" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_177183f29f438c488b5e8510cd" ON "audit_logs" ("actor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_85c204d8e47769ac183b32bf9c" ON "audit_logs" ("entity_id") `);
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "FK_336d332b73385acf5c5879e42be" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "FK_336d332b73385acf5c5879e42be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85c204d8e47769ac183b32bf9c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_177183f29f438c488b5e8510cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e124016d61fe935a7f10ac3fa"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_deliveries_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7536ac8ded802c28bcf5ad713f"`);
        await queryRunner.query(`DROP TABLE "webhook_subscriptions"`);
    }

}
