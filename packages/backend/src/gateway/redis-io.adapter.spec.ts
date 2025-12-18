import { Test, TestingModule } from '@nestjs/testing';
import { RedisIoAdapter } from './redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { ProjectService } from '../projects/project.service';
import { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { IoAdapter } from '@nestjs/platform-socket.io';

jest.mock('@socket.io/redis-adapter');
jest.mock('redis');

describe('RedisIoAdapter', () => {
  let adapter: RedisIoAdapter;
  let app: jest.Mocked<INestApplication>;
  let configService: jest.Mocked<ConfigService>;
  let projectService: jest.Mocked<ProjectService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            findByProjectId: jest.fn(),
          },
        },
        {
          provide: 'INestApplication',
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.get('INestApplication');
    configService = module.get(ConfigService);
    projectService = module.get(ProjectService);

    adapter = new RedisIoAdapter(app, configService);
    app.get.mockReturnValue(projectService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('connectToRedis', () => {
    it('should create and connect redis clients', async () => {
      const pubClient = { connect: jest.fn(), duplicate: jest.fn() };
      const subClient = { connect: jest.fn() };
      (createClient as jest.Mock).mockReturnValue(pubClient);
      pubClient.duplicate.mockReturnValue(subClient);

      await adapter.connectToRedis();

      expect(createClient).toHaveBeenCalled();
      expect(pubClient.connect).toHaveBeenCalled();
      expect(subClient.connect).toHaveBeenCalled();
      expect(createAdapter).toHaveBeenCalledWith(pubClient, subClient);
    });
  });

  describe('createIOServer', () => {
    let server: any;
    let next: jest.Mock;
    let socket: any;

    beforeEach(() => {
      next = jest.fn();
      socket = {
        handshake: {
          headers: { origin: '' },
          query: { projectId: '' },
        },
      };
      server = {
        use: jest.fn((fn) => fn(socket, next)),
        adapter: jest.fn(),
      };
      jest.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue(server);
    });

    it('should allow frontend URL', async () => {
      configService.get.mockReturnValue('http://frontend.com');
      socket.handshake.headers.origin = 'http://frontend.com';
      adapter.createIOServer(3000);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny if origin is missing', async () => {
      socket.handshake.headers.origin = '';
      adapter.createIOServer(3000);
      expect(next).toHaveBeenCalledWith(new Error('Origin header is missing.'));
    });

    it('should deny if projectId is missing', async () => {
      socket.handshake.headers.origin = 'http://widget.com';
      socket.handshake.query.projectId = '';
      adapter.createIOServer(3000);
      expect(next).toHaveBeenCalledWith(
        new Error('Project ID is missing or invalid.')
      );
    });

    it('should deny if project not found', async () => {
      socket.handshake.headers.origin = 'http://widget.com';
      socket.handshake.query.projectId = '1';
      projectService.findByProjectId.mockResolvedValue(null);
      adapter.createIOServer(3000);
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(new Error('Project with ID 1 not found.'));
    });

    it('should deny if origin not in whitelist', async () => {
      socket.handshake.headers.origin = 'http://not-allowed.com';
      socket.handshake.query.projectId = '1';
      projectService.findByProjectId.mockResolvedValue({
        whitelistedDomains: ['allowed.com'],
      } as any);
      adapter.createIOServer(3000);
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith(new Error('Not allowed by CORS'));
    });

    it('should allow if origin is in whitelist', async () => {
      socket.handshake.headers.origin = 'http://allowed.com';
      socket.handshake.query.projectId = '1';
      projectService.findByProjectId.mockResolvedValue({
        whitelistedDomains: ['allowed.com'],
      } as any);
      adapter.createIOServer(3000);
      await new Promise(process.nextTick);
      expect(next).toHaveBeenCalledWith();
    });
  });
});