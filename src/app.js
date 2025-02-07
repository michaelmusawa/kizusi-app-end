import express from "express";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import carRoutes from "./routes/car.js";
import bookingRoutes from "./routes/booking.js";
import paymentRouter from "./routes/payment.js";

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRouter);

export default app;
