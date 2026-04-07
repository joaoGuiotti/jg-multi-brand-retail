import { InvalidUuidError, UniqueEntityID } from '../unique-entity-id';

describe('UniqueEntityID', () => {
  it('should create a valid UUID when no ID is provided', () => {
    const id = new UniqueEntityID();
    expect(id.id).toBeDefined();
    expect(typeof id.id).toBe('string');
  });

  it('should accept a valid UUID', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const id = new UniqueEntityID(validUuid);
    expect(id.id).toBe(validUuid);
  });

  it('should throw InvalidUuidError for an invalid UUID', () => {
    expect(() => new UniqueEntityID('not-a-valid-uuid')).toThrow(
      InvalidUuidError,
    );
  });

  it('should throw InvalidUuidError for an empty (invalid) UUID format', () => {
    expect(
      () => new UniqueEntityID('00000000-0000-0000-0000-00000000000X'),
    ).toThrow(InvalidUuidError);
  });

  it('toString should return the UUID string', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const id = new UniqueEntityID(validUuid);
    expect(id.toString()).toBe(validUuid);
  });

  it('static create should return a new UniqueEntityID', () => {
    const id = UniqueEntityID.create();
    expect(id).toBeInstanceOf(UniqueEntityID);
  });

  it('two different instances should have different IDs', () => {
    const id1 = new UniqueEntityID();
    const id2 = new UniqueEntityID();
    expect(id1.id).not.toBe(id2.id);
  });
});

describe('InvalidUuidError', () => {
  it('should have the correct name and default message', () => {
    const error = new InvalidUuidError();
    expect(error.name).toBe('InvalidUuidError');
    expect(error.message).toBe('ID must be a valid UUID');
  });

  it('should allow custom message', () => {
    const error = new InvalidUuidError('custom error');
    expect(error.message).toBe('custom error');
  });
});
