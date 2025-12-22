import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds missing foreign key constraints to the invitations table.
 * The original schema had projectId and inviterId columns but no FK constraints,
 * which could lead to orphaned invitations if projects or users are deleted.
 */
export class AddInvitationForeignKeys1733839200000 implements MigrationInterface {
  name = 'AddInvitationForeignKeys1733839200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add FK constraint for project_id -> projects.id
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitations_project_id" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add FK constraint for inviter_id -> users.id
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitations_inviter_id" 
      FOREIGN KEY ("inviter_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_inviter_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_project_id"
    `);
  }
}
