import express from "express";
import { fetchCategories } from "../controllers/categoryController.js"; // Add `.js` extension

const categoryRouter = express.Router();

categoryRouter.get("/", fetchCategories);

export default categoryRouter;
