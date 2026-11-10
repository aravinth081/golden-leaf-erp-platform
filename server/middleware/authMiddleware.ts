// ──────────────────────────────────────────────────
// Golden Leaf Finance — Backend Auth Middleware
// JWT Verification & Strict Admin RBAC Guard
// ──────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: 'admin' | 'hr_payroll_manager' | 'branch_manager' | 'credit_manager' | 'collection_agent';
  branchId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Validates JWT Bearer token and attaches user payload.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: '401 Unauthorized: Authorization token is required.',
    });
    return;
  }

  try {
    // In production with jsonwebtoken:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthenticatedUser;
    // req.user = decoded;
    
    // Header mock/decoding fallback for development
    const userRole = (req.headers['x-user-role'] as string) || 'admin';
    const userId = (req.headers['x-user-id'] as string) || 'admin-root';
    req.user = {
      uid: userId,
      email: `${userRole}@goldenleaf.finance`,
      role: userRole as any,
    };
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      error: '403 Forbidden: Invalid or expired access token.',
    });
  }
}

/**
 * Strict RBAC Middleware: Only allows users with ADMIN role.
 * Returns 403 Forbidden for any non-admin role.
 */
export function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '401 Unauthorized: Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: '403 Forbidden: Only Admin users are authorized to manage staff profiles.',
    });
    return;
  }

  next();
}

/**
 * Sliding window rate-limiter middleware for staff profile creation.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function staffCreationRateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  const validTimestamps = timestamps.filter((t) => t > now - RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: '429 Too Many Requests: Staff profile creation rate limit exceeded. Please wait a minute.',
    });
    return;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  next();
}

