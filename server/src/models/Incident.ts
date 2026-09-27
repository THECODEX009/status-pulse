import { Schema, model, Document, Types } from 'mongoose';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'CRITICAL';
export type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';

export interface IIncident extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: Types.ObjectId[];
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'CRITICAL'],
      default: 'MEDIUM',
      required: true,
    },
    status: {
      type: String,
      enum: ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'],
      default: 'INVESTIGATING',
      required: true,
      index: true,
    },
    affectedServices: [{ type: Schema.Types.ObjectId, ref: 'MonitoredService' }],
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

IncidentSchema.index({ organizationId: 1, createdAt: -1 });

export const Incident = model<IIncident>('Incident', IncidentSchema);
