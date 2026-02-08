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
app.use(express.json({ limit: "256kb" }));
app.use(express.static(parentDir));

const BASIC_US_CITIES = [
  { city: "New York", state: "NY", lat: 40.7128, lon: -74.0060 },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437 },
  { city: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298 },
  { city: "Houston", state: "TX", lat: 29.7604, lon: -95.3698 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.0740 },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lon: -75.1652 },
  { city: "San Antonio", state: "TX", lat: 29.4241, lon: -98.4936 },
  { city: "San Diego", state: "CA", lat: 32.7157, lon: -117.1611 },
  { city: "Dallas", state: "TX", lat: 32.7767, lon: -96.7970 },
  { city: "San Jose", state: "CA", lat: 37.3382, lon: -121.8863 },
  { city: "Austin", state: "TX", lat: 30.2672, lon: -97.7431 },
  { city: "Jacksonville", state: "FL", lat: 30.3322, lon: -81.6557 },
  { city: "Fort Worth", state: "TX", lat: 32.7555, lon: -97.3308 },
  { city: "Columbus", state: "OH", lat: 39.9612, lon: -82.9988 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431 },
  { city: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194 },
  { city: "Indianapolis", state: "IN", lat: 39.7684, lon: -86.1581 },
  { city: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321 },
  { city: "Denver", state: "CO", lat: 39.7392, lon: -104.9903 },
  { city: "Washington", state: "DC", lat: 38.9072, lon: -77.0369 },
  { city: "Boston", state: "MA", lat: 42.3601, lon: -71.0589 },
  { city: "El Paso", state: "TX", lat: 31.7619, lon: -106.4850 },
  { city: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816 },
  { city: "Detroit", state: "MI", lat: 42.3314, lon: -83.0458 },
  { city: "Oklahoma City", state: "OK", lat: 35.4676, lon: -97.5164 },
  { city: "Portland", state: "OR", lat: 45.5152, lon: -122.6784 },
  { city: "Las Vegas", state: "NV", lat: 36.1699, lon: -115.1398 },
  { city: "Memphis", state: "TN", lat: 35.1495, lon: -90.0490 },
  { city: "Louisville", state: "KY", lat: 38.2527, lon: -85.7585 },
  { city: "Baltimore", state: "MD", lat: 39.2904, lon: -76.6122 },
  { city: "Milwaukee", state: "WI", lat: 43.0389, lon: -87.9065 },
  { city: "Albuquerque", state: "NM", lat: 35.0844, lon: -106.6504 },
  { city: "Tucson", state: "AZ", lat: 32.2226, lon: -110.9747 },
  { city: "Fresno", state: "CA", lat: 36.7378, lon: -119.7871 },
  { city: "Mesa", state: "AZ", lat: 33.4152, lon: -111.8315 },
  { city: "Sacramento", state: "CA", lat: 38.5816, lon: -121.4944 },
  { city: "Atlanta", state: "GA", lat: 33.7490, lon: -84.3880 },
  { city: "Kansas City", state: "MO", lat: 39.0997, lon: -94.5786 },
  { city: "Colorado Springs", state: "CO", lat: 38.8339, lon: -104.8214 },
  { city: "Miami", state: "FL", lat: 25.7617, lon: -80.1918 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lon: -78.6382 },
  { city: "Omaha", state: "NE", lat: 41.2565, lon: -95.9345 },
  { city: "Long Beach", state: "CA", lat: 33.7701, lon: -118.1937 },
  { city: "Virginia Beach", state: "VA", lat: 36.8529, lon: -75.9780 },
  { city: "Oakland", state: "CA", lat: 37.8044, lon: -122.2711 },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.2650 },
  { city: "Tulsa", state: "OK", lat: 36.1540, lon: -95.9928 },
  { city: "Arlington", state: "TX", lat: 32.7357, lon: -97.1081 },
  { city: "Tampa", state: "FL", lat: 27.9506, lon: -82.4572 },
  { city: "New Orleans", state: "LA", lat: 29.9511, lon: -90.0715 }
];

const BASIC_INTL_HOTELS = [
  {
    id: "basic-paris-1",
    name: "Green Haven Hotel",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lon: 2.3522,
    description: "Eco-chic hotel with bike rental",
    stars: 4,
    amenities: ["bike rental", "organic food"],
    website: "https://www.google.com/maps/search/Green+Haven+Hotel+Paris"
  },
  {
    id: "basic-london-1",
    name: "River Green Hotel",
    city: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lon: -0.1278,
    description: "City hotel with renewable energy features",
    stars: 4,
    amenities: ["renewable", "energy", "recycling"],
    website: "https://www.google.com/maps/search/River+Green+Hotel+London"
  },
  {
    id: "basic-tokyo-1",
    name: "Green Tokyo Inn",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lon: 139.6503,
    description: "Modern eco hotel",
    stars: 4,
    amenities: ["led lighting", "recycling"],
    website: "https://www.google.com/maps/search/Green+Tokyo+Inn+Tokyo"
  },
  {
    id: "basic-singapore-1",
    name: "Earth Hotel Singapore",
    city: "Singapore",
    country: "Singapore",
    lat: 1.3521,
    lon: 103.8198,
    description: "Award-winning green building",
    stars: 5,
    amenities: ["solar", "ev charging", "organic"],
    website: "https://www.google.com/maps/search/Earth+Hotel+Singapore"
  },
  {
    id: "basic-dubai-1",
    name: "Desert Eco Suites",
    city: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2048,
    lon: 55.2708,
    description: "Sustainable suites with water conservation",
    stars: 4,
    amenities: ["water conservation", "energy"],
    website: "https://www.google.com/maps/search/Desert+Eco+Suites+Dubai"
  }
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildBasicHotels() {
  const variants = [
    { suffix: "Eco Stay", amenities: ["energy", "recycling"], stars: 4, latOffset: 0.01, lonOffset: 0.01 },
    { suffix: "Green Suites", amenities: ["water conservation", "led lighting"], stars: 3, latOffset: -0.01, lonOffset: 0.008 },
    { suffix: "Solar Lodge", amenities: ["solar", "ev charging"], stars: 4, latOffset: 0.006, lonOffset: -0.009 },
    { suffix: "Low Carbon Hotel", amenities: ["low carbon", "recycling"], stars: 4, latOffset: 0.014, lonOffset: -0.002 },
    { suffix: "Renewable Inn", amenities: ["renewable", "energy"], stars: 3, latOffset: -0.012, lonOffset: 0.012 },
    { suffix: "Eco Loft", amenities: ["led lighting", "energy"], stars: 3, latOffset: 0.004, lonOffset: 0.015 },
    { suffix: "Green Key Hotel", amenities: ["green key", "recycling"], stars: 4, latOffset: -0.015, lonOffset: -0.004 },
    { suffix: "Sustainable House", amenities: ["sustainable", "water conservation"], stars: 3, latOffset: 0.018, lonOffset: 0.005 },
    { suffix: "Urban Eco Hotel", amenities: ["energy", "low carbon"], stars: 4, latOffset: -0.006, lonOffset: -0.014 },
    { suffix: "Eco Residence", amenities: ["solar", "organic"], stars: 4, latOffset: 0.009, lonOffset: -0.016 }
  ];

  const usHotels = BASIC_US_CITIES.flatMap((city, index) => {
    const citySlug = slugify(city.city);
    return variants.map((variant, variantIndex) => ({
      id: `basic-us-${citySlug}-${variantIndex + 1}`,
      name: `${city.city} ${variant.suffix}`,
      city: city.city,
      country: "USA",
      lat: city.lat + variant.latOffset,
      lon: city.lon + variant.lonOffset,
      description: `Sustainable stay in ${city.city}, ${city.state}`,
      stars: variant.stars,
      amenities: variant.amenities,
      website: `https://www.google.com/maps/search/${encodeURIComponent(city.city + " " + variant.suffix)}`
    }));
  });

  return [...usHotels, ...BASIC_INTL_HOTELS];
}

const BASIC_HOTELS = buildBasicHotels();

const COUNTRY_ALIASES = new Map([
  ["uk", "united kingdom"],
  ["u.k.", "united kingdom"],
  ["great britain", "united kingdom"],
  ["england", "united kingdom"],
  ["scotland", "united kingdom"],
  ["wales", "united kingdom"],
  ["u.s.", "usa"],
  ["us", "usa"],
  ["united states", "usa"]
]);

function normalizeCountryName(value) {
  const key = (value || "").trim().toLowerCase();
  return COUNTRY_ALIASES.get(key) || key;
}

function basicHotelSearch(city, country) {
  const cityNeedle = (city || "").split(",")[0].trim().toLowerCase();
  const countryNeedle = normalizeCountryName(country || "");

  return BASIC_HOTELS.filter(h => {
    const matchesCity = cityNeedle ? h.city.toLowerCase().includes(cityNeedle) : true;
    const matchesCountry = countryNeedle ? h.country.toLowerCase().includes(countryNeedle) : true;
    return matchesCity && matchesCountry;
  });
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeoutId);
  return result;
}

// Free endpoint: OpenStreetMap + Nominatim (no API key needed)
app.get("/api/hotels/search", async (req, res) => {
  try {
    const { city = "Rome", country = "" } = req.query;
    const timedResult = await withTimeout(searchOpenSourceHotels({ city, country }), 6000);
    let hotels = Array.isArray(timedResult) ? timedResult : [];
    let source = "OpenStreetMap (Sustainability filter)";

    if (!hotels || hotels.length === 0) {
      hotels = basicHotelSearch(city, country);
      source = "Basic (Local)";
    } else if (hotels.length < 10) {
      const fallback = basicHotelSearch(city, country);
      const merged = [...hotels];
      const seen = new Set(hotels.map(h => String(h.id)));
      fallback.forEach(hotel => {
        const key = String(hotel.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(hotel);
        }
      });
      hotels = merged;
      source = "OpenStreetMap + Basic (Local)";
    }

    res.json({ success: true, hotels, source });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Post-booking feed endpoint (no storage, validates shape and discards)
app.post("/api/bookings/post-booking", (req, res) => {
  const payload = req.body || {};
  const bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
  const receivedAt = new Date().toISOString();

  if (bookings.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No bookings provided.",
      receivedAt
    });
  }

  // Minimal validation: ensure each booking has an id and a status
  const invalid = bookings.filter(b => !b || !b.id || !b.status);
  if (invalid.length > 0) {
    return res.status(422).json({
      success: false,
      error: "Some bookings are missing required fields (id, status).",
      invalidCount: invalid.length,
      receivedAt
    });
  }

  // No persistence by design
  return res.status(202).json({
    success: true,
    receivedAt,
    bookingCount: bookings.length
  });
});

app.listen(5000, ()=>console.log("API running on http://localhost:5000"));