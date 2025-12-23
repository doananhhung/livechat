
import { TestHarness } from './utils/test-harness';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { ProjectService } from '../src/projects/project.service';
import { DataSource } from 'typeorm';
import { User, Project } from '../src/database/entities';

describe('Security Boundary Enforcement (E2E)', () => {
  let harness: TestHarness;
  let projectService: ProjectService;
  let dataSource: DataSource;

  // Test Data
  let user: User;
  let projectId: number;
  const trustedOrigin = 'https://trusted.com';
  const evilOrigin = 'https://evil.com';

  beforeAll(async () => {
    harness = new TestHarness();
    await harness.bootstrap();
    projectService = harness.app.get(ProjectService);
    dataSource = harness.app.get(DataSource);

    // Clean DB before starting this suite
    await harness.cleanDatabase();

    // --- Seed Data for OBAC ---
    const userRepo = dataSource.getRepository(User);
    user = await userRepo.save(
      userRepo.create({
        email: 'security-test@example.com',
        passwordHash: 'hashed_placeholder',
        fullName: 'Security Tester',
        isEmailVerified: true,
      })
    );

    // Create Project via Service (handles defaults)
    const project = await projectService.create(
      {
        name: 'Secure Project',
        whitelistedDomains: [],
      },
      user.id
    );
    projectId = project.id;

    // Manually enforce whitelist via SQL to ensure test precondition is met
    // (Bypassing DTO limitations if any)
    await dataSource.query(
      `UPDATE projects SET whitelisted_domains = $1 WHERE id = $2`,
      [['trusted.com'], projectId]
    );
  });

  afterAll(async () => {
    await harness.teardown();
  });

  describe('OBAC (Origin-Based Access Control)', () => {
    it('should return 403 Forbidden when NO Origin header is present', async () => {
      await request(harness.app.getHttpServer())
        .get(`/public/projects/${projectId}/settings`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 403 Forbidden when Origin is unauthorized (evil.com)', async () => {
      await request(harness.app.getHttpServer())
        .get(`/public/projects/${projectId}/settings`)
        .set('Origin', evilOrigin)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 200 OK when Origin is whitelisted (trusted.com)', async () => {
      const response = await request(harness.app.getHttpServer())
        .get(`/public/projects/${projectId}/settings`)
        .set('Origin', trustedOrigin)
        .expect(HttpStatus.OK);

      // The important assertion is the 200 status - OBAC passed.
      // widgetSettings may be an empty object if not configured.
      expect(response.body).toBeDefined();
    });
  });

  describe('SSRF (Server-Side Request Forgery) Protection', () => {
    // The ScreenshotController validation logic runs BEFORE the service is called.
    // Even though ScreenshotService is mocked, the Controller's IP/Hostname checks will still execute.

    it('should block requests to localhost', async () => {
      const url = encodeURIComponent('http://localhost:3000/secret');
      await request(harness.app.getHttpServer())
        .get(`/utils/screenshot?url=${url}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should block requests to 127.0.0.1 (IPv4 Loopback)', async () => {
      const url = encodeURIComponent('http://127.0.0.1/secret');
      await request(harness.app.getHttpServer())
        .get(`/utils/screenshot?url=${url}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should block requests to 169.254.169.254 (Cloud Metadata)', async () => {
      const url = encodeURIComponent('http://169.254.169.254/latest/meta-data');
      await request(harness.app.getHttpServer())
        .get(`/utils/screenshot?url=${url}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow requests to valid external URLs', async () => {
      const url = encodeURIComponent('https://google.com');
      // The mock service returns a buffer, so we expect 200 and a binary response
      await request(harness.app.getHttpServer())
        .get(`/utils/screenshot?url=${url}`)
        .expect(HttpStatus.OK)
        .expect('Content-Type', /image\/jpeg/);
    });
  });
});
