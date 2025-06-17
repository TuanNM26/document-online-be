import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DocumentGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-document')
  handleJoinDocument(
    @MessageBody() documentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(documentId);
    console.log(`Client ${client.id} joined room ${documentId}`);
  }
  notifyPageChange(documentId: string, changeType: string) {
    this.server.to(documentId).emit('page-change', { documentId, changeType });
  }
  notifyDocumentChange(documentId: string, updatedDocument: any) {
    this.server.to(documentId).emit('document-change', updatedDocument);
  }

  notifyHomeDocumentUpdate(
    eventType: 'created' | 'updated' | 'deleted',
    document: any,
  ) {
    this.server.emit('home-document-change', { eventType, document });
  }
}
