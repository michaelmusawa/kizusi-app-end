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
  // Now cancel the booking. Here we use the 'id' from req.params.

  console.log("Im here", req.body);
  let token;

  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ message: "Booking ID is required in URL parameters" });
  }

  console.log("booking id", id);

  try {
    const { amount, first_name, last_name, remarks } = req.body;
    const name = `${first_name} ${last_name}`;

    // Query transactions for the booking
    const transactionsResult = await pool.query(
      `SELECT * FROM "Transaction" WHERE "bookingId" = $1`,
      [id]
    );

    if (transactionsResult.rows.length < 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for booking" });
    }

    const transactions = transactionsResult.rows;

    console.log("DAm transaction", transactions);
    // If there are two transactions, refund half the amount on each; if one, refund full amount.
    const refundAmount = transactions.length === 2 ? amount / 2 : amount;

    console.log("refund amount", refundAmount);

    // Array to collect refund responses
    const refundResponses = [];

    // Process refund request for each transaction sequentially
    for (const transaction of transactions) {
      const refundRequest = {
        confirmation_code: transaction.reference, // assuming 'reference' is the confirmation code
        amount: refundAmount,
        username: name,
        remarks: remarks,
      };

      console.log("Refund request:", refundRequest);

      const pesapalConsumerKey = "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW";
      const pesapalConsumerSecret = "osGQ364R49cXKeOYSpaOnT++rHs=";
      const pesapalEndpoint = "https://cybqa.pesapal.com/pesapalv3";

      // Access Token
      const tokenResponse = await axios.post(
        `${pesapalEndpoint}/api/Auth/RequestToken`,
        {
          consumer_key: pesapalConsumerKey,
          consumer_secret: pesapalConsumerSecret,
        }
      );

      const accessToken = tokenResponse.data.token;

      if (accessToken) {
        token = accessToken;
      } else {
        throw new Error("Failed to retrieve access token from Pesapal.");
      }

      // Send refund request to Pesapal
      const refundResponse = await axios.post(
        `https://cybqa.pesapal.com/pesapalv3/api/Transactions/RefundRequest`,
        refundRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      refundResponses.push(refundResponse.data);
      console.log("Refund response:", refundResponse.data);
    }

    if (refundResponses[0].status === "200") {
      const booking = await cancelBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      return res.status(200).json({
        message: "Booking cancelled successfully",
        booking,
        refundResponses,
      });
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
};
