import {
  getUsers,
  addUser,
  getUserById,
  updateUserById,
} from "../actions/userActions.js";

export const fetchUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by Id:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, clerkId, phone } = req.body;

    if (!name || !email || !clerkId) {
      return res
        .status(400)
        .json({ error: "Name, email and clerkId are required" });
    }

    const newUser = await addUser({ name, email, clerkId, phone });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const { name, email, password, phone, image } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, phone and password are required" });
    }

    const updatedUser = await updateUserById({
      id,
      name,
      email,
      password,
      phone,
      image,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};
