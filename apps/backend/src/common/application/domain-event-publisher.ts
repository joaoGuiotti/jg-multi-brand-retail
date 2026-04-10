import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { AggregateRoot } from '../domain/aggregate-root';

@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async publishEvents(aggregate: AggregateRoot) {
    const events = aggregate.getUncommittedEvents();

    for (const event of events) {
      const eventName = this.getEventName(event);
      this.logger.debug(`Publishing domain event: ${eventName}`);

      // Emit system-wide via EventEmitter2
      await this.eventEmitter.emitAsync(eventName, event);

      aggregate.markEventAsDispatched(event);
    }

    aggregate.clearEvents();
  }

  private getEventName(event: any): string {
    // Convencao: Classe NotificationCreatedEvent -> notification.created
    return event.constructor.name
      .replace(/Event$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1.$2')
      .toLowerCase();
  }
}
