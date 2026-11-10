// ──────────────────────────────────────────────────
// Golden Leaf Finance — Staff Management Express Router
// Mounts Admin Staff Profile Endpoints with RBAC and Rate Limiter
// ──────────────────────────────────────────────────

import { Router } from 'express';
import {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  resetPassword,
  deleteStaff,
} from '../controllers/staffController';
import {
  authenticateToken,
  requireAdminRole,
  staffCreationRateLimiter,
} from '../middleware/authMiddleware';

const router = Router();

// Apply Authentication and Strict Admin RBAC to all staff profile routes
router.use(authenticateToken);
router.use(requireAdminRole);

// Endpoints
router.post('/staff', staffCreationRateLimiter, createStaff);
router.get('/staff', getStaffList);
router.get('/staff/:id', getStaffById);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/status', updateStaffStatus);
router.patch('/staff/:id/reset-password', resetPassword);
router.delete('/staff/:id', deleteStaff);

export default router;

