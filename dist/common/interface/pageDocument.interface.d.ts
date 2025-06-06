import { Types } from "mongoose";
export interface PageDocument extends Document {
    _id: Types.ObjectId;
    documentId: Types.ObjectId;
    pageNumber: number;
    filePath: string;
    fileType: string;
    pdfPageIndex: number;
}
