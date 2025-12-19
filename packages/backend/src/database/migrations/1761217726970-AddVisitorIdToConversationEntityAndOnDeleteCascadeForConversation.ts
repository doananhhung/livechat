import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisitorIdToConversationEntityAndOnDeleteCascadeForConversation1761217726970
  implements MigrationInterface
{
  name =
    'AddVisitorIdToConversationEntityAndOnDeleteCascadeForConversation1761217726970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_9f16876c6b675f1f683e604b511"`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_5e69b83b44d285e714d9349a8fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "email_change_requests" DROP CONSTRAINT "FK_e800aef9e4acf92283f401add9a"`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'sending'`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "project_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "visitor_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_9f16876c6b675f1f683e604b511" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_5e69b83b44d285e714d9349a8fe" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_change_requests" DROP CONSTRAINT "FK_45b3391d341b1a58def2881e8c2"`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_5e69b83b44d285e714d9349a8fe"`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_9f16876c6b675f1f683e604b511"`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "visitor_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "project_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'sent'`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_5e69b83b44d285e714d9349a8fe" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_9f16876c6b675f1f683e604b511" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }
}
