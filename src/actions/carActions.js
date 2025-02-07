import pool from "../db.js";

export async function getCarById(id) {
  try {
    const result = await pool.query(
      `
      SELECT 
        car.id ,
        car.name,
        car.price,
        car."imageUrl" AS image,
        car.description,
        JSONB_BUILD_OBJECT('brandId', b.id, 'brandName', b.name) AS brand,
        JSONB_BUILD_OBJECT('id', c.id, 'name', c.name) AS category,
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT('featureId', f.id, 'featureName', f."featureName", 'featureValue', f."featureValue")
          ) FILTER (WHERE f.id IS NOT NULL), '[]'::jsonb
        ) AS features,
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT('addonId', a.id, 'addonName', a.name)
          ) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb
        ) AS addons
      FROM "Car" car
      LEFT JOIN "Brand" b ON car."brandId" = b.id
      LEFT JOIN "Category" c ON car."categoryId" = c.id
      LEFT JOIN "Feature" f ON car.id = f."carId"
      LEFT JOIN "Addon" a ON car.id = a."carId"
      WHERE car.id = $1
      GROUP BY car.id, b.id, c.id
    `,
      [id]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching car by ID:", error);
    throw error;
  }
}

export async function fetchFilteredCars(filter, query, limit) {
  try {
    const result = await pool.query(
      `
      SELECT 
        car.id, 
        car.name,
        car.price,
        car."imageUrl" AS image,
        car.description,
        JSONB_BUILD_OBJECT('brandId', b.id, 'brandName', b.name) AS brand,
        JSONB_BUILD_OBJECT('categoryId', c.id, 'categoryName', c.name) AS category,
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT('featureId', f.id, 'featureName', f."featureName", 'featureValue', f."featureValue")
          ) FILTER (WHERE f.id IS NOT NULL), '[]'::jsonb
        ) AS features,
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT('addonId', a.id, 'addonName', a.name)
          ) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb
        ) AS addons
      FROM "Car" car
      LEFT JOIN "Brand" b ON car."brandId" = b.id
      LEFT JOIN "Category" c ON car."categoryId" = c.id
      LEFT JOIN "Feature" f ON car.id = f."carId"
      LEFT JOIN "Addon" a ON car.id = a."carId"
      WHERE 
    (car.name ILIKE $1 OR
  c.name ILIKE $1 OR
  b.name ILIKE $1 OR
  car.description ILIKE $1) AND
  b.name ILIKE $2
GROUP BY car.id, b.id, c.id
      ORDER BY car.name ASC
      LIMIT $3
    `,
      [`%${query}%`, `%${filter}%`, limit]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching filtered cars:", error);
    throw error;
  }
}
