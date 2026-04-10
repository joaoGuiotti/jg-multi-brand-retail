import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { MarkAsReadUseCase } from '../../application/use-cases/notifications/mark-as-read.use-case';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly markAsReadUseCase: MarkAsReadUseCase) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth.token || client.handshake.headers.authorization;
      // In a real app we decode the JWT token here
      // For MVP we mock extraction from handshake query
      const tenantId = client.handshake.query.tenantId as string;
      const userId = client.handshake.query.userId as string;

      if (!tenantId || !userId) {
         this.logger.warn(`Client missing identifying queries: ${client.id}`);
         client.disconnect();
         return;
      }

      const room = `${tenantId}:${userId}`;
      client.join(room);
      client.data.tenantId = tenantId;
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id} to room ${room}. Query: ${JSON.stringify(client.handshake.query)}`);
    } catch (error) {
      this.logger.error(`Error connecting client ${client.id}`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { notificationId: string },
  ) {
    try {
      const { tenantId, userId } = client.data;
      await this.markAsReadUseCase.execute(tenantId, userId, payload.notificationId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking notification read: ${error.message}`);
      return { success: false, error: 'Failed to mark as read' };
    }
  }
}
