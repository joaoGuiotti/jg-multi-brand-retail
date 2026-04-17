# Quickstart: RMA Management

This guide helps you set up and test the RMA module.

## Setup

1.  **Database Migration**:
    ```bash
    npx prisma migrate dev --name init_rma_module
    ```
2.  **Seed Data**:
    Ensure you have at least one `COMPLETED` sale in your database.
    ```bash
    npm run seed
    ```

## Development Workflow

1.  **Backend**:
    - Start the backend server: `npm run start:dev` in `apps/backend`.
    - Explore the API at `http://localhost:3000/api/v1/returns`.
2.  **Frontend**:
    - Start the frontend dev server: `npm run start` in `apps/frontend`.
    - Navigate to `/returns` to see the list or `/sales` to initiate a return.

## Testing the Flow

1.  **Initiate Return**:
    - Login as `USER`.
    - Go to a completed sale and click "Iniciar Devolução".
    - Select items and click "Submit".
2.  **Approve Return**:
    - Login as `ADMIN`.
    - Go to the "Devoluções" list.
    - Click "Approve" on the new request.
    - Verify that inventory movements are created and stock is updated.
