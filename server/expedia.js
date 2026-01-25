import axios from "axios";
import { normalizeExpediaHotel } from "./normalize.js";

export async function searchExpediaHotels({ city, checkin, checkout, adults }) {
  const response = await axios.get(
    "https://expedia13.p.rapidapi.com/hotels/search",
    {
      params: { location: city, checkin, checkout, adults },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST
      }
    }
  );
  return (response.data.results || []).map(normalizeExpediaHotel);
}