import pool from "../db.js";

export async function fetchFilteredCategories() {
  try {
    const result = await pool.query(
      `
      SELECT 
        c.id, 
        c.name,
        c.price, 
        c."imageUrl" AS image, 
        c.description, 
        ARRAY_AGG(
            JSON_BUILD_OBJECT('brandId', b.id, 'brandName', b.name)
        ) AS brands
      FROM "Category" c
      LEFT JOIN "CategoryBrand" cb ON c.id = cb."categoryId"
      LEFT JOIN "Brand" b ON cb."brandId" = b.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching filtered categories:", error);
    throw new Error("Failed to fetch categories.");
  }
}
