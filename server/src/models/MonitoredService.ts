import { Schema, model, Document, Types } from 'mongoose';

export type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN';

export interface IMonitoredService extends Document {
  _id: Types.ObjectId;
  name: string;
  url: string;
  checkIntervalSeconds: number;
  status: ServiceStatus;
  lastCheckedAt?: Date;
  organizationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MonitoredServiceSchema = new Schema<IMonitoredService>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    checkIntervalSeconds: { type: Number, default: 60, min: 10, max: 3600 },
    status: {
      type: String,
      enum: ['OPERATIONAL', 'DEGRADED', 'DOWN'],
      default: 'OPERATIONAL',
      index: true,
    },
    lastCheckedAt: { type: Date },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  },
  { timestamps: true }
);

MonitoredServiceSchema.index({ organizationId: 1, name: 1 });

export const MonitoredService = model<IMonitoredService>('MonitoredService', MonitoredServiceSchema);
