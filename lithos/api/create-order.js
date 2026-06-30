import Razorpay from "razorpay";

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

export default async function handler(req, res) {
  // CORS Headers for serverless environment
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency, receipt } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required." });
    }

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
}
