

// ~/Downloads/auralynk_starter/server/create-room.js
import express from "express";
import axios from "axios";
import cors from "cors";

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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Daily API server running at http://localhost:${PORT}`);
});
