import { Server, Socket } from 'socket.io';
export declare class DocumentGateway {
    server: Server;
    handleJoinDocument(documentId: string, client: Socket): void;
    notifyPageChange(documentId: string, changeType: string): void;
    notifyDocumentChange(documentId: string, updatedDocument: any): void;
    notifyHomeDocumentUpdate(eventType: 'created' | 'updated' | 'deleted', document: any): void;
}
