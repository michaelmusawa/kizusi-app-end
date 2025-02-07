import express from "express";
import { fetchCars, fetchCarById } from "../controllers/carController.js"; // Add `fetchCarById`

const carRouter = express.Router();

carRouter.get("/", fetchCars);
carRouter.get("/:id", fetchCarById); // New route for fetching car by ID

export default carRouter;
