import * as express from "express";

declare global {
  namespace Express {
    interface Request {
        user?: {
          id?: string;
          username?: string;
          rol?: string;
          lu?: string | null;
          // lo que guardes en el token
        };
    }
  }
}
