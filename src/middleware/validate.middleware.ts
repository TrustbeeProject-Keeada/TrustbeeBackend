import { NextFunction, Request, Response } from "express";
import { z } from "zod";

// src/middleware/validate.ts
export const validate = (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
  void res;
    try {
      // Throws error if invalid
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // Valid! Continue.
    } catch (error) {
      next(error);
    }
  };
