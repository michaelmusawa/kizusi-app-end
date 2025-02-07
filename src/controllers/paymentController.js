import axios from "axios";
import pool from "../db.js";

let token;

export const initiatePayment = async (req, res) => {
  const {
    amount,
    email,
    phoneNumber,
    reference,
    description,
    callbackUrl,
    userId,
    carId,
    bookingDate,
    departure,
    destination,
    bookType,
    paymentType,
    addons,
  } = req.body;

  try {
    // Pesapal API credentials and endpoint

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
    }

    // 🔹 Start database transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Start transaction

      // ✅ Create booking in database BEFORE sending payment request
      const bookingQuery = `
      INSERT INTO "Booking" (id, "userId", "carId", "bookingDate", amount, "departure", "destination", "paymentStatus", "bookType", "paymentType")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9)
      RETURNING id;
    `;

      const bookingResult = await pool.query(bookingQuery, [
        reference, // Booking ID matches Pesapal reference
        userId,
        carId,
        bookingDate,
        amount,
        departure,
        destination,
        bookType,
        paymentType,
      ]);

      const bookingId = bookingResult.rows[0].id;

      // ✅ Insert addons into "BookingAddon" table
      if (addons && addons.length > 0) {
        // Get addon IDs from addon names
        const addonIds = [];
        for (const addonName of addons) {
          const addonResult = await pool.query(
            `SELECT id FROM "Addon" WHERE name = $1`,
            [addonName]
          );
          if (addonResult.rows.length > 0) {
            addonIds.push(addonResult.rows[0].id);
          } else {
            throw new Error(`Addon '${addonName}' not found.`);
          }
        }

        // Insert addons into BookingAddon table
        if (addonIds.length > 0) {
          const addonQuery = `
        INSERT INTO "BookingAddon" ("bookingId", "addonId")
        VALUES ${addonIds.map((_, index) => `($1, $${index + 2})`).join(", ")}
      `;

          await pool.query(addonQuery, [bookingId, ...addonIds]);
        }
      }

      await client.query("COMMIT"); // Commit transaction
      client.release(); // Release DB connection

      // Prepare the payment request payload
      const paymentRequest = {
        id: reference,
        currency: "KES",
        amount: amount,
        description: description,
        callback_url: callbackUrl,
        notification_id: "1d4ba5e1-aa68-4d94-8644-dc34ebddffd9",
        billing_address: {
          email_address: email,
          phone_number: phoneNumber,
          country_code: "KE",
          first_name: "John",
          middle_name: "Musambati",
          last_name: "Wechakhulia",
        },
      };

      // Send payment request to Pesapal
      const paymentResponse = await axios.post(
        `https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest`,
        paymentRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.status(200).json(paymentResponse.data);
      console.log("the payment response", paymentResponse.data);
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback transaction on error
      client.release(); // Release DB connection
      console.error("Database transaction error:", error);
      res.status(500).json({ error: "Failed to create booking." });
    }
  } catch (error) {
    console.error("Pesapal payment initiation error:", error);
    res.status(500).json({ error: "Failed to initiate payment with Pesapal." });
  }
};

export const handlePaymentCallback = async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Send payment request to Pesapal
    const statusResponse = await axios.get(
      `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // Check if the payment was successful

    const paymentStatus =
      statusResponse.data.status_code === 1 ? "CONFIRMED" : "FAILED";

    // Update the booking status
    const updateBookingQuery = `
      UPDATE "Booking"
      SET "paymentStatus" = $1
      WHERE id = $2
      RETURNING id;
    `;
    const updateResult = await client.query(updateBookingQuery, [
      paymentStatus,
      OrderMerchantReference,
    ]);

    if (updateResult.rowCount === 0) {
      throw new Error("Booking not found.");
    }

    // If payment was successful, record the transaction
    if (paymentStatus === "CONFIRMED") {
      const transactionQuery = `
        INSERT INTO "Transaction" ("bookingId", amount, status, reference)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `;
      const newTransaction = await client.query(transactionQuery, [
        OrderMerchantReference,
        statusResponse.data.amount,
        "SUCCESS",
        OrderTrackingId,
      ]);

      if (!newTransaction.rows[0]) {
        throw new Error("Error creating transaction.");
      }
    }

    await client.query("COMMIT");

    // Send a response back to Pesapal
    res.status(200).json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed, rolled back:", error);
    res.status(500).send("Failed to process IPN.");
  } finally {
    client.release(); // Release the database connection
  }
};
