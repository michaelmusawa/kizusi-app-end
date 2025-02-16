import {
  fetchFilteredBookings,
  getBookingById,
  cancelBookingById,
} from "../actions/bookingAction.js"; // Add `getCarById`

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
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await cancelBookingById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res
      .status(200)
      .json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling booking by ID:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};
