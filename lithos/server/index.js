import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import Razorpay from "razorpay";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env file from the parent directory (lithos/.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Razorpay SDK
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id: key_id,
    key_secret: key_secret,
  });
};

// 1. Create Order Endpoint
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    // Validate request fields
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required." });
    }

    // Minimum amount: 100 paise
    if (amount < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise (1 INR)." });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(401).json({ error: "Authentication failed. Razorpay API keys are missing or invalid." });
    }

    const options = {
      amount: Math.round(amount),
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    
    const statusCode = error.statusCode || 500;
    if (statusCode === 401) {
      return res.status(401).json({ error: "Authentication failed with Razorpay API." });
    }
    
    return res.status(500).json({ error: error.message || "Failed to create Razorpay order." });
  }
});

// 2. Verify Payment Signature Endpoint
app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Missing fields: return 400
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({ error: "Server configuration error. Razorpay KEY_SECRET is missing." });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Compare generated signature with razorpay_signature
    if (generated_signature === razorpay_signature) {
      return res.status(200).json({ status: "success", verified: true });
    } else {
      // Signature mismatch: return 400
      return res.status(400).json({ error: "Signature mismatch. Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return res.status(500).json({ error: error.message || "Failed to verify signature." });
  }
});

app.listen(PORT, () => {
  console.log(`Razorpay backend server running on http://localhost:${PORT}`);
});
