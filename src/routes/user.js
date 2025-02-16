import express from "express";
import {
  fetchUsers,
  createUser,
  getUser,
  updateUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", fetchUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", createUser);
userRouter.post("/:id", updateUser);

export default userRouter;
