import { Router } from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  triggerManualCheck,
} from '../controllers/service.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createServiceSchema, updateServiceSchema } from '../schemas/service.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getServices);
router.get('/:id', getServiceById);

// Admin & Engineer can create/edit/delete services
router.post('/', authorize(['Admin', 'Engineer']), validate(createServiceSchema), createService);
router.put('/:id', authorize(['Admin', 'Engineer']), validate(updateServiceSchema), updateService);
router.delete('/:id', authorize(['Admin']), deleteService);
router.post('/:id/check', authorize(['Admin', 'Engineer']), triggerManualCheck);

export default router;
