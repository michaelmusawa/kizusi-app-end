import {
  fetchFilteredBookings,
  getBookingById,
  cancelBookingById,
} from "../actions/bookingAction.js"; // Add `getCarById`
import pool from "../db.js";
import axios from "axios";

export const fetchBookings = async (req, res) => {
  try {
    // Extract parameters from the query string
    const { filter, query } = req.query;

    console.log("query", query);

    // Pass the parameters to getCategories
    const bookings = await fetchFilteredBookings(filter, query);

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const fetchBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({ message: "booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Booking ID is required in URL parameters" });
  }

  try {
    const { amount, first_name, last_name, remarks } = req.body;
    const name = `${first_name} ${last_name}`;

    // Query transactions for the booking
    const transactionsResult = await pool.query(
      `SELECT * FROM "Transaction" WHERE "bookingId" = $1`,
      [id]
    );

    if (transactionsResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for booking" });
    }

    const transactions = transactionsResult.rows;
    const refundAmount = transactions.length === 2 ? amount / 2 : amount;

    const refundResponses = [];

    // Pesapal credentials
    const pesapalConsumerKey = "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW";
    const pesapalConsumerSecret = "osGQ364R49cXKeOYSpaOnT++rHs=";
    const pesapalEndpoint = "https://cybqa.pesapal.com/pesapalv3";

    // Get Pesapal access token
    const tokenResponse = await axios.post(
      `${pesapalEndpoint}/api/Auth/RequestToken`,
      {
        consumer_key: pesapalConsumerKey,
        consumer_secret: pesapalConsumerSecret,
      }
    );

    const accessToken = tokenResponse.data.token;

    if (!accessToken) {
      throw new Error("Failed to retrieve access token from Pesapal.");
    }

    // Process refund for each transaction
    for (const transaction of transactions) {
      const refundRequest = {
        confirmation_code: transaction.confirmationCode, // Ensure this is the correct field
        amount: parseFloat(refundAmount), // Ensure amount is a number
        username: name,
        remarks: remarks,
      };

      console.log("Refund request:", refundRequest);

      try {
        const refundResponse = await axios.post(
          `${pesapalEndpoint}/api/Transactions/RefundRequest`,
          refundRequest,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Refund response:", refundResponse.data);
        refundResponses.push(refundResponse.data);
      } catch (error) {
        console.error(
          "Refund request failed:",
          error.response?.data || error.message
        );
        refundResponses.push({
          status: "500",
          message: error.response?.data?.message || "Refund request failed",
        });
      }
    }

    // Check refund responses
    if (refundResponses.some((response) => response.status === "200")) {
      const booking = await cancelBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      return res.status(200).json({
        message: "Booking cancelled successfully",
        booking,
        refundResponses,
      });
    } else {
      return res.status(400).json({
        message: "Booking cancellation failed",
        refundResponses,
      });
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
};
