import express from "express";
import {
  fetchBookings,
  fetchBookingById,
  cancelBooking,
} from "../controllers/bookingController.js"; // Add `fetchCarById`

const bookingRouter = express.Router();

bookingRouter.get("/", fetchBookings);
bookingRouter.get("/:id", fetchBookingById);
bookingRouter.post("/cancel/:id", cancelBooking);

export default bookingRouter;
