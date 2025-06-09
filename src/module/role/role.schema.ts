import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ required: true, unique: true })
  roleName: string;

  @Prop({ type: [String], required: true, default: [] })
  permissions: string[];

  @Prop()
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
