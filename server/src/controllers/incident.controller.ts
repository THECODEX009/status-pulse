import { Request, Response } from 'express';
import { Incident } from '../models/Incident.js';
import { Organization } from '../models/Organization.js';
import { emitToOrg, emitToPublic } from '../sockets/socket.gateway.js';

export const createIncident = async (req: Request, res: Response): Promise<void> => {
  const { title, description, severity, affectedServices } = req.body;
  const organizationId = req.user!.organizationId;

  const incident = await Incident.create({
    title,
    description,
    severity,
    status: 'INVESTIGATING',
    affectedServices,
    organizationId,
    createdBy: req.user!.userId,
  });

  const populatedIncident = await Incident.findById(incident._id)
    .populate('affectedServices', 'name url status')
    .populate('createdBy', 'name email');

  // Emit WebSocket Event
  emitToOrg(organizationId, 'NEW_INCIDENT_CREATED', populatedIncident);

  const org = await Organization.findById(organizationId);
  if (org) {
    emitToPublic(org.slug, 'NEW_INCIDENT_CREATED', populatedIncident);
  }

  res.status(201).json({
    message: 'Incident created successfully',
    incident: populatedIncident,
  });
};

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user!.organizationId;

  const incidents = await Incident.find({ organizationId })
    .populate('affectedServices', 'name url status')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ incidents });
};

export const getIncidentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const incident = await Incident.findOne({ _id: id, organizationId })
    .populate('affectedServices', 'name url status')
    .populate('createdBy', 'name email');

  if (!incident) {
    res.status(404).json({ message: 'Incident not found' });
    return;
  }

  res.json({ incident });
};

export const updateIncidentStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, description } = req.body;
  const organizationId = req.user!.organizationId;

  const incident = await Incident.findOne({ _id: id, organizationId });
  if (!incident) {
    res.status(404).json({ message: 'Incident not found' });
    return;
  }

  incident.status = status;
  if (description) {
    incident.description += `\n\n[Update ${new Date().toISOString()}]: ${description}`;
  }

  if (status === 'RESOLVED' && !incident.resolvedAt) {
    incident.resolvedAt = new Date();
  }

  await incident.save();

  const updatedIncident = await Incident.findById(id)
    .populate('affectedServices', 'name url status')
    .populate('createdBy', 'name email');

  emitToOrg(organizationId, 'INCIDENT_UPDATED', updatedIncident);

  const org = await Organization.findById(organizationId);
  if (org) {
    emitToPublic(org.slug, 'INCIDENT_UPDATED', updatedIncident);
  }

  res.json({ message: 'Incident status updated', incident: updatedIncident });
};

export const deleteIncident = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const incident = await Incident.findOneAndDelete({ _id: id, organizationId });
  if (!incident) {
    res.status(404).json({ message: 'Incident not found' });
    return;
  }

  res.json({ message: 'Incident deleted successfully' });
};
