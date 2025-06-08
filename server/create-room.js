

// ~/Downloads/auralynk_starter/server/create-room.js
import express from "express";
import axios from "axios";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

const DAILY_API_KEY = "a3b9de5a340f6c5b03c01728fded2d3caae01358c5ae384fa367cfae9aaee525"; // Replace this!

app.post("/create-room", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.daily.co/v1/rooms",
      {
        properties: {
          enable_chat: true,
          start_video_off: true,
          start_audio_off: true,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now
        },
      },
      {
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const roomUrl = response.data.url;
    res.status(200).json({ roomUrl });
  } catch (err) {
    console.error("Failed to create Daily room:", err.message);
    res.status(500).json({ error: "Room creation failed" });
  }
});

app.post("/send-confirmation", async (req, res) => {
  const { email, time } = req.body;
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    await transporter.sendMail({
      from: 'Auralynk <no-reply@auralynk.com>',
      to: email,
      subject: 'Booking Confirmed',
      text: `Your session is booked for ${new Date(time).toLocaleString()}.`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
    res.status(500).json({ error: 'Email failed' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Daily API server running at http://localhost:${PORT}`);
});
