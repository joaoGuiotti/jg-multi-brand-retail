# Research: RMA Management

## Decisions & Rationale

### Integration with Inventory
- **Decision**: Use `InventoryMovementTypes.RETURN` when a return is approved.
- **Rationale**: The core system already supports this movement type for restocking. It ensures auditability and consistency with existing stock adjustment logic.

### State Management (Frontend)
- **Decision**: Use Angular Signals for the Return Wizard.
- **Rationale**: Signals provide a more reactive and simpler alternative to RxJS for local state management (wizard steps, selected items), aligning with Principle V (Simplicity).

### Admin Notifications
- **Decision**: Use the existing `NotificationModule` with a broadcast to the `ADMIN` role.
- **Rationale**: Leverages Sprint 1 infrastructure to ensure admins are notified immediately of new requests without custom WebSocket handling in the RMA module.

### Partial Returns Tracking
- **Decision**: Implement a validation service that checks `SaleItem.quantity` vs `Sum(ReturnItem.quantity)` for a given sale.
- **Rationale**: Prevents users from returning more items than purchased across multiple return requests.

## Alternatives Considered

- **Alternative**: Direct stock update in the Return repository.
- **Reason Rejected**: Violates clean architecture. The Inventory domain should own all stock changes via movements.

- **Alternative**: Using NgRx for the return wizard state.
- **Reason Rejected**: Overly complex for a local wizard state. Signals are the preferred approach for this project's constitution.
