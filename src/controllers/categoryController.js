import { fetchFilteredCategories } from "../actions/categoryActions.js";

export const fetchCategories = async (req, res) => {
  try {
    const categories = await fetchFilteredCategories();

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};
