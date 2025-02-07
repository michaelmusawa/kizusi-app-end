import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PESAPAL_BASE_URL = "https://www.pesapal.com/api/";
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

const getOAuthToken = async () => {
  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/OAuth2/Token`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${CONSUMER_KEY}:${CONSUMER_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    return response.data.token;
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    throw new Error("Failed to fetch OAuth token");
  }
};

export { PESAPAL_BASE_URL, getOAuthToken };
