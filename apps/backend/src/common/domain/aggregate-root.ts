import EventEmitter2 from 'eventemitter2';
import { Entity } from './entity';
import { IDomainEvent } from './events/domain-event.interface';

export abstract class AggregateRoot<T = any> extends Entity<T> {
  public readonly events: Set<IDomainEvent> = new Set();
  private readonly dispatchedEvents: Set<IDomainEvent> = new Set();
  private readonly localMediator = new EventEmitter2();

  applyEvent(event: IDomainEvent): void {
    this.events.add(event);
  }

  registerHandler(event: string, handler: (event: IDomainEvent) => void) {
    this.localMediator.on(event, handler);
  }

  markEventAsDispatched(event: IDomainEvent) {
    this.dispatchedEvents.add(event);
  }

  getUncommittedEvents(): IDomainEvent[] {
    return Array.from(this.events).filter(
      (event) => !this.dispatchedEvents.has(event),
    );
  }

  clearEvents() {
    this.events.clear();
    this.dispatchedEvents.clear();
  }
}
