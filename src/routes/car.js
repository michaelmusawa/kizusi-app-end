import express from "express";
import { fetchCars, fetchCarById } from "../controllers/carController.js"; // Add `fetchCarById`

const carRouter = express.Router();

carRouter.get("/", fetchCars);
carRouter.get("/:id", fetchCarById);

export default carRouter;
