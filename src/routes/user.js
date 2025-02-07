import express from "express";
import {
  fetchUsers,
  createUser,
  getUser,
} from "../controllers/userController.js"; // Add `.js` extension

const userRouter = express.Router();

userRouter.get("/", fetchUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", createUser);

export default userRouter;
