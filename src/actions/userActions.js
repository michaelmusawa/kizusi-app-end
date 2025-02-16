import pool from "../db.js";

// Fetch all users
export async function getUsers() {
  const result = await pool.query(`SELECT * FROM "User"`);
  return result.rows;
}

export async function getUserById(id) {
  const result = await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [id]);
  return result.rows[0];
}

// Add a new user
export async function addUser(data) {
  const { name, email, clerkId, phone } = data;
  const result = await pool.query(
    `INSERT INTO "User" (id, name, email, "clerkId", phone) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [clerkId, name, email, clerkId, phone]
  );
  return result.rows[0];
}

export async function updateUserById(data) {
  const { id, name, email, password, phone, image } = data;
  const result = await pool.query(
    `UPDATE "User"
     SET name = $2, email = $3, password = $4, phone = $5, image = $6
     WHERE id = $1
     RETURNING *`,
    [id, name, email, password, phone, image]
  );
  return result.rows[0];
}
