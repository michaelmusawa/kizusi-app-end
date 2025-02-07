import express from "express";
import cors from "cors";
import categoryRouter from "./routes/category.js";
import carRouter from "./routes/car.js";
import bookingRouter from "./routes/booking.js";
import app from "./app.js";
import paymentRouter from "./routes/payment.js";
import userRouter from "./routes/user.js";

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware for parsing JSON
app.use(express.json());

// Routes
app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/cars", carRouter);
app.use("/bookings", bookingRouter);
app.use("/payments", paymentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
