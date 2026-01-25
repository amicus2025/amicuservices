import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { searchOpenSourceHotels } from "./opendata.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.join(__dirname, '..');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static(parentDir));

// Free endpoint: OpenStreetMap + Nominatim (no API key needed)
app.get("/api/hotels/search", async (req, res) => {
  try {
    const { city = "Rome", country = "" } = req.query;
    const hotels = await searchOpenSourceHotels({ city, country });
    res.json({ success: true, hotels, source: "OpenStreetMap (Free)" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(5000, ()=>console.log("API running on http://localhost:5000"));