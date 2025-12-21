
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppModule } from '../src/app.module';
import { EventConsumerModule } from '../src/event-consumer/event-consumer.module';
import { EventConsumerService } from '../src/event-consumer/event-consumer.service';
import { VisitorMessageReceivedEvent } from '../src/inbox/events';

describe('BullMQ Integration (E2E)', () => {
  let app: INestApplication;
  let eventEmitter: EventEmitter2;
  let eventConsumerService: EventConsumerService;

  const mockEventConsumerService = {
    processEvent: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, EventConsumerModule],
    })
      .overrideProvider(EventConsumerService)
      .useValue(mockEventConsumerService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    eventEmitter = app.get(EventEmitter2);
    // Now that EventConsumerModule is imported, we should be able to get the service
    // However, since it is not exported, we must select the module, or ensure the override works.
    // When overriding, Nest replaces the provider. We can try retrieving it from the module.
    eventConsumerService = app.select(EventConsumerModule).get(EventConsumerService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should enqueue a job when visitor sends a message and consume it in worker', async () => {
    // 1. Prepare event payload
    const payload: VisitorMessageReceivedEvent = {
        tempId: 'test-temp-id',
        content: 'Hello BullMQ',
        visitorUid: 'test-visitor-uid',
        projectId: 1,
        socketId: 'test-socket-id',
    };

    // 2. Emit event (simulation of Gateway -> InboxEventHandler)
    // The InboxEventHandler listens to 'visitor.message.received'
    // and calls BullMqProducerService which adds job to queue.
    eventEmitter.emit('visitor.message.received', payload);

    // 3. Wait for Consumer to process it.
    // Since it's async via Redis, we need to wait.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Verify mock was called
    expect(mockEventConsumerService.processEvent).toHaveBeenCalled();

    // Verify payload structure passed to consumer matches expectation
    const calledArg = mockEventConsumerService.processEvent.mock.calls[0][0]; // First call, first arg
    expect(calledArg).toMatchObject({
        type: 'NEW_MESSAGE_FROM_VISITOR',
        payload: {
            tempId: 'test-temp-id',
            content: 'Hello BullMQ',
            visitorUid: 'test-visitor-uid',
            projectId: 1,
            socketId: 'test-socket-id',
        }
    });
  }, 10000);
});
