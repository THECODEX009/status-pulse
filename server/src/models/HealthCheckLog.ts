import { Schema, model, Document, Types } from 'mongoose';
import { ServiceStatus } from './MonitoredService.js';

export interface IHealthCheckLog extends Document {
  _id: Types.ObjectId;
  serviceId: Types.ObjectId;
  organizationId: Types.ObjectId;
  statusCode: number;
  responseTimeMs: number;
  status: ServiceStatus;
  timestamp: Date;
}

const HealthCheckLogSchema = new Schema<IHealthCheckLog>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'MonitoredService', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    status: {
      type: String,
      enum: ['OPERATIONAL', 'DEGRADED', 'DOWN'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    // Enable timeseries optimization features if supported by MongoDB deployment
  }
);

// Compound indexes for time-range aggregation queries
HealthCheckLogSchema.index({ serviceId: 1, timestamp: -1 });
HealthCheckLogSchema.index({ organizationId: 1, timestamp: -1 });

export const HealthCheckLog = model<IHealthCheckLog>('HealthCheckLog', HealthCheckLogSchema);
