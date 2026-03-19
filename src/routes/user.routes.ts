import { Router } from "express";
import {
  createUser,
  deleteUserById,
  getUserById,
  getUsers,
  updateUserById,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createUserValidation } from "../models/user.model.js";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);
router.post("/", validate(createUserValidation), createUser);

export default router;
