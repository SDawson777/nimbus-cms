import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "admin_token";

/**
 * Enterprise Admin Authentication Middleware
 * Validates JWT tokens with detailed error responses for proper client handling
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  
  if (!token) {
    return res.status(401).json({ 
      error: "UNAUTHORIZED",
      code: "NO_TOKEN",
      message: "Authentication required",
    });
  }
  
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[Auth] JWT_SECRET not configured");
      throw new Error("JWT_SECRET not configured");
    }
    
    const payload = jwt.verify(token, secret);
    (req as any).admin = payload;
    return next();
  } catch (err: any) {
    // Provide detailed error codes for client-side handling
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        error: "TOKEN_EXPIRED",
        code: "TOKEN_EXPIRED",
        message: "Session expired. Please log in again.",
        expiredAt: err.expiredAt,
      });
    }
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        error: "INVALID_TOKEN",
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
      });
    }
    
    if (err.name === "NotBeforeError") {
      return res.status(401).json({ 
        error: "TOKEN_NOT_ACTIVE",
        code: "TOKEN_NOT_ACTIVE",
        message: "Token not yet valid",
      });
    }
    
    // Generic auth error
    return res.status(401).json({ 
      error: "UNAUTHORIZED",
      code: "AUTH_ERROR",
      message: "Authentication failed",
    });
  }
}
