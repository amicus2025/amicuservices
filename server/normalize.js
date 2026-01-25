export function normalizeExpediaHotel(h) {
  return {
    id: `expedia-${h.id}`,
    name: h.name,
    region: inferRegion(h.address?.countryCode),
    country: h.address?.countryCode || "",
    certifications: [],
    co2_rating: "Unknown",
    affiliate_url: h.links?.web || "#",
    lat: h.coordinates?.latitude || null,
    lon: h.coordinates?.longitude || null,
    notes: h.description?.short || "",
    source: "expedia"
  };
}

function inferRegion(code) {
  if (["US","CA"].includes(code)) return "US";
  if (["FR","DE","IT","ES","NL"].includes(code)) return "EU";
  if (["AE","OM","QA"].includes(code)) return "Middle East";
  if (["JP","TH","SG","IN"].includes(code)) return "Asia";
  return "Other";
}