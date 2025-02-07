import { fetchFilteredCars, getCarById } from "../actions/carActions.js"; // Add `getCarById`

export const fetchCars = async (req, res) => {
  try {
    // Extract parameters from the query string
    const { filter, query, limit } = req.query;

    // Pass the parameters to getCategories
    const cars = await fetchFilteredCars(filter, query, limit);

    res.status(200).json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
};

export const fetchCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await getCarById(id);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json(car);
  } catch (error) {
    console.error("Error fetching car by ID:", error);
    res.status(500).json({ error: "Failed to fetch car" });
  }
};
