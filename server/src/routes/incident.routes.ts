import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createIncidentSchema, updateIncidentStatusSchema } from '../schemas/incident.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getIncidents);
router.get('/:id', getIncidentById);

router.post('/', authorize(['Admin', 'Engineer']), validate(createIncidentSchema), createIncident);
router.patch('/:id/status', authorize(['Admin', 'Engineer']), validate(updateIncidentStatusSchema), updateIncidentStatus);
router.delete('/:id', authorize(['Admin']), deleteIncident);

export default router;
