import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_USER_ID, SYSTEM_USER_EMAIL } from '@live-chat/shared-types';

/**
 * Seeds the System user for automated AI actions.
 * This user cannot log in (password_hash is null, is_email_verified is false).
 * The user is protected from deletion by UsersService guard.
 */
export class SeedSystemUser1769276486378 implements MigrationInterface {
  name = 'SeedSystemUser1769276486378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotent insert: only insert if user does not exist
    await queryRunner.query(
      `
      INSERT INTO users (
        id,
        email,
        password_hash,
        is_email_verified,
        full_name,
        timezone,
        language,
        status,
        role,
        created_at,
        updated_at,
        tokens_valid_from,
        is_two_factor_authentication_enabled
      )
      SELECT
        $1,
        $2,
        NULL,
        false,
        'System',
        'UTC',
        'en',
        'active',
        'system',
        NOW(),
        NOW(),
        NOW(),
        false
      WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE id = $1
      )
    `,
      [SYSTEM_USER_ID, SYSTEM_USER_EMAIL]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE id = $1`, [
      SYSTEM_USER_ID,
    ]);
  }
}
