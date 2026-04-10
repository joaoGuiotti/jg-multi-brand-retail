import { DomainEventPublisher } from '../domain-event-publisher';
import { AggregateRoot } from '../../domain/aggregate-root';
import { IDomainEvent } from '../../domain/events/domain-event.interface';
import { UniqueEntityID } from '../../domain/unique-entity-id';
import { EventEmitter2 } from 'eventemitter2';

class MockEvent implements IDomainEvent {
  id = new UniqueEntityID();
  occurredAt = new Date();
  eventVersion = '1.0';
}

class MockAggregate extends AggregateRoot<any> {
  static create() {
    const aggregate = new MockAggregate({ foo: 'bar' });
    aggregate.applyEvent(new MockEvent());
    return aggregate;
  }
}

describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    eventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    } as any;
    publisher = new DomainEventPublisher(eventEmitter);
  });

  it('should publish events from aggregate and clear them', async () => {
    const aggregate = MockAggregate.create();
    const event = aggregate.getUncommittedEvents()[0];

    await publisher.publishEvents(aggregate);

    expect(eventEmitter.emitAsync).toHaveBeenCalledWith('mock', event);
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});
