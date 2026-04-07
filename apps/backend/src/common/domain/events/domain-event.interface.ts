import { ValueObject } from '../value-object';

export interface IDomainEvent {
  id: ValueObject;
  occurredAt: Date;
  eventVersion: string;
}
