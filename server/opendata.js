// Free open-source hotel data fetcher using OpenStreetMap Nominatim
// No API key required - completely free

export async function searchOpenSourceHotels({ city, country }) {
  try {
    console.log(`Searching for hotels in: city="${city}", country="${country}"`);
    
    // First, determine if we have a city or country
    let finalCity = city;
    let finalCountry = country;
    
    // If no country provided, check if the city parameter is actually a country
    if (!finalCountry || finalCountry === '') {
      const countryCheck = await isCountry(city);
      if (countryCheck) {
        finalCountry = city;
        // Find a major city in this country
        finalCity = await findMajorCityInCountry(finalCountry);
        console.log(`Detected country: "${finalCountry}", using major city: "${finalCity}"`);
      }
    }
    
    // If still no country, try to detect it from city
    if (!finalCountry || finalCountry === '') {
      const detectedCountry = await detectCountryFromCity(finalCity);
      if (detectedCountry) {
        finalCountry = detectedCountry;
        console.log(`Detected country from city: "${finalCountry}"`);
      }
    }
    
    console.log(`Final search parameters: city="${finalCity}", country="${finalCountry}"`);
    
    // Get coordinates for the city
    const cityGeocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(finalCity)}${finalCountry ? ',' + encodeURIComponent(finalCountry) : ''}&format=json&limit=1&timeout=10`,
      {
        headers: {
          'User-Agent': 'AmicusServices-HotelSearch/1.0'
        }
      }
    );
    
    if (!cityGeocodeResponse.ok) {
      console.error(`City geocode error: ${cityGeocodeResponse.status}`);
      return [];
    }
    
    const cityData = await cityGeocodeResponse.json();
    if (!cityData || cityData.length === 0) {
      console.log('City not found');
      return [];
    }
    
    const cityLat = parseFloat(cityData[0].lat);
    const cityLon = parseFloat(cityData[0].lon);
    console.log(`City coordinates: ${cityLat}, ${cityLon}`);
    
    // Try primary Overpass query first (larger bbox for regions)
    let hotels = await queryOverpassAPI(cityLat, cityLon, finalCity, finalCountry);
    
    if (hotels.length === 0) {
      // Fallback to Nominatim if Overpass returns nothing
      console.log('Overpass returned no results, trying Nominatim...');
      hotels = await fallbackNominatimSearch({ city: finalCity, country: finalCountry });
    }
    
    console.log(`Total hotels found: ${hotels.length}`);
    return hotels;

  } catch (error) {
    console.error('Hotel search error:', error.message);
    return [];
  }
}

async function isCountry(name) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1&timeout=5`,
      { headers: { 'User-Agent': 'AmicusServices-HotelSearch/1.0' } }
    );
    
    if (!response.ok) return false;
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      // Check if it's a country by looking at the type
      const isCountryType = result.type === 'administrative' && 
                           (result.class === 'boundary' || result.class === 'place') &&
                           result.importance > 0.5;
      return isCountryType;
    }
    return false;
  } catch (e) {
    console.log('Error checking if country:', e.message);
    return false;
  }
}

async function findMajorCityInCountry(country) {
  try {
    // Map of countries to major cities for hotel searches
    const countryToCities = {
      // Asia
      'thailand': 'Bangkok',
      'vietnam': 'Ho Chi Minh City',
      'cambodia': 'Phnom Penh',
      'laos': 'Vientiane',
      'philippines': 'Manila',
      'indonesia': 'Jakarta',
      'malaysia': 'Kuala Lumpur',
      'singapore': 'Singapore',
      'japan': 'Tokyo',
      'south korea': 'Seoul',
      'korea': 'Seoul',
      'china': 'Beijing',
      'india': 'Delhi',
      'bangladesh': 'Dhaka',
      'pakistan': 'Islamabad',
      'sri lanka': 'Colombo',
      'nepal': 'Kathmandu',
      'myanmar': 'Yangon',
      'burma': 'Yangon',
      'mongolia': 'Ulaanbaatar',
      'taiwan': 'Taipei',
      'hong kong': 'Hong Kong',
      'thailand': 'Bangkok',
      // Europe (Major Tourist Destinations)
      'italy': 'Rome',
      'france': 'Paris',
      'spain': 'Barcelona',
      'germany': 'Berlin',
      'united kingdom': 'London',
      'portugal': 'Lisbon',
      'greece': 'Athens',
      'switzerland': 'Zurich',
      'austria': 'Vienna',
      'netherlands': 'Amsterdam',
      'belgium': 'Brussels',
      'czech republic': 'Prague',
      'czechia': 'Prague',
      'poland': 'Warsaw',
      'sweden': 'Stockholm',
      'norway': 'Oslo',
      'denmark': 'Copenhagen',
      'ireland': 'Dublin',
      'hungary': 'Budapest',
      'croatia': 'Dubrovnik',
      'iceland': 'Reykjavik',
      'slovenia': 'Ljubljana',
      'romania': 'Bucharest',
      'united states': 'New York',
      // Middle East (Major Tourist Destinations)
      'united arab emirates': 'Dubai',
      'uae': 'Dubai',
      'saudi arabia': 'Riyadh',
      'qatar': 'Doha',
      'oman': 'Muscat',
      'jordan': 'Amman',
      'lebanon': 'Beirut',
      'israel': 'Tel Aviv',
      'turkey': 'Istanbul',
      // Oceania
      'australia': 'Sydney',
      // South America
      'argentina': 'Buenos Aires',
      'brazil': 'São Paulo',
      'chile': 'Santiago',
      'colombia': 'Bogotá',
      'ecuador': 'Quito',
      'peru': 'Lima',
      'venezuela': 'Caracas',
      'bolivia': 'La Paz',
      'paraguay': 'Asunción',
      'uruguay': 'Montevideo',
      'guyana': 'Georgetown',
      'suriname': 'Paramaribo',
      // Latin America / Central America
      'mexico': 'Mexico City',
      'costa rica': 'San José',
      'panama': 'Panama City',
      'honduras': 'Tegucigalpa',
      'guatemala': 'Guatemala City',
      'el salvador': 'San Salvador',
      'nicaragua': 'Managua',
      'belize': 'Belize City'
    };
    
    const countryLower = country.toLowerCase();
    const city = countryToCities[countryLower] || country;
    console.log(`Found major city for ${country}: ${city}`);
    return city;
  } catch (e) {
    console.log('Error finding major city:', e.message);
    return country;
  }
}

async function detectCountryFromCity(city) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&timeout=5`,
      { headers: { 'User-Agent': 'AmicusServices-HotelSearch/1.0' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      // Try to extract country from address
      if (result.address && result.address.country) {
        console.log(`Detected country from city: ${result.address.country}`);
        return result.address.country;
      }
    }
    return null;
  } catch (e) {
    console.log('Error detecting country:', e.message);
    return null;
  }
}

async function queryOverpassAPI(lat, lon, city, country) {
  try {
    console.log('Querying Overpass API...');
    
    // Larger bbox for better coverage in regions - 1 degree ≈ 111 km
    const bbox = `${lat-1.0},${lon-1.0},${lat+1.0},${lon+1.0}`;
    
    // More permissive query - separate the name requirement
    const overpassQuery = `
      [bbox:${bbox}];
      (
        node["tourism"="hotel"];
        way["tourism"="hotel"];
        node["tourism"="guest_house"];
        way["tourism"="guest_house"];
        node["tourism"="hostel"];
        way["tourism"="hostel"];
        node["tourism"="alpine_hut"];
        way["tourism"="alpine_hut"];
        node["tourism"="apartment"];
        way["tourism"="apartment"];
        node["amenity"="hotel"];
        way["amenity"="hotel"];
      );
      out center geom;
      timeout 25;
    `;
    
    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'User-Agent': 'AmicusServices-HotelSearch/1.0'
      }
    });
    
    if (!overpassResponse.ok) {
      console.error(`Overpass API error: ${overpassResponse.status}`);
      return [];
    }
    
    const osmData = await overpassResponse.json();
    console.log(`Overpass found ${(osmData.elements || []).length} elements`);
    
    let hotels = (osmData.elements || [])
      .filter(elem => {
        const lat = elem.center ? elem.center.lat : elem.lat;
        const lon = elem.center ? elem.center.lon : elem.lon;
        // Only require coordinates, name is optional - we'll enrich it
        if (!lat || !lon) return false;
        return true;
      })
      .slice(0, 200)
      .map((elem, idx) => {
        const lat = elem.center ? elem.center.lat : elem.lat;
        const lon = elem.center ? elem.center.lon : elem.lon;
        
        // Try to get name, fallback to generating one
        let hotelName = elem.tags?.name || null;
        
        if (!hotelName) {
          // If no name in OSM, we'll try to query this location for nearby POIs
          console.log(`No name for hotel at (${lat}, ${lon}), will enrich later`);
        } else {
          console.log(`✓ Processing: "${hotelName}" at (${lat}, ${lon})`);
        }
        
        let website = '#';
        if (elem.tags?.website) {
          website = elem.tags.website;
          if (!website.startsWith('http')) {
            website = 'https://' + website;
          }
        } else {
          const encodedName = hotelName ? encodeURIComponent(hotelName) : encodeURIComponent(`hotel ${lat} ${lon}`);
          const location = encodeURIComponent(city + (country ? ', ' + country : ''));
          website = `https://www.google.com/maps/search/${encodedName}+${location}`;
        }
        
        return {
          id: elem.id || `osm-${idx}`,
          name: hotelName, // Can be null if not found in OSM
          city: city,
          country: country,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          description: elem.tags?.description || elem.tags?.['addr:street'] || `Hotel in ${city}`,
          stars: parseInt(elem.tags?.stars) || 3,
          amenities: ['eco-friendly', 'sustainable'],
          leed: true,
          image: 'images/bg_1.jpg',
          website: website,
          osm_id: elem.id
        };
      });
    
    // Second pass: try to enrich hotels without names using Nominatim reverse geocoding
    console.log(`Before enrichment: ${hotels.filter(h => h.name).length} hotels with names`);
    
    hotels = await enrichHotelNames(hotels, city, country);
    
    console.log(`After enrichment: ${hotels.filter(h => h.name).length} hotels with names`);
    console.log(`Overpass returned ${hotels.length} hotels`);
    return hotels;

  } catch (error) {
    console.error('Overpass API error:', error.message);
    return [];
  }
}

async function enrichHotelNames(hotels, city, country) {
  try {
    // For hotels without names, try to get names via reverse geocoding or nearby search
    const hotelsWithoutNames = hotels.filter(h => !h.name);
    
    console.log(`Enriching ${hotelsWithoutNames.length} hotels without names...`);
    
    for (let hotel of hotelsWithoutNames) {
      try {
        // Try reverse geocoding to find nearby named POIs
        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${hotel.lat}&lon=${hotel.lon}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'AmicusServices-HotelSearch/1.0' } }
        );
        
        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          
          // Try different name sources in order of preference
          if (reverseData.address?.hotel) {
            hotel.name = reverseData.address.hotel;
            console.log(`✓ Enriched with hotel name: ${hotel.name}`);
          } else if (reverseData.address?.accommodation) {
            hotel.name = reverseData.address.accommodation;
            console.log(`✓ Enriched with accommodation name: ${hotel.name}`);
          } else if (reverseData.address?.building) {
            hotel.name = reverseData.address.building;
            console.log(`✓ Enriched with building name: ${hotel.name}`);
          } else if (reverseData.address?.shop) {
            hotel.name = reverseData.address.shop;
            console.log(`✓ Enriched with shop name: ${hotel.name}`);
          } else if (reverseData.name) {
            hotel.name = reverseData.name;
            console.log(`✓ Enriched with POI name: ${hotel.name}`);
          } else {
            // Generate a name based on location
            hotel.name = `${city} Hotel #${Math.floor(Math.random() * 1000)}`;
            console.log(`Generated name: ${hotel.name}`);
          }
        }
      } catch (e) {
        console.log(`Could not enrich hotel at (${hotel.lat}, ${hotel.lon}):`, e.message);
        // Keep the hotel even if enrichment fails
      }
    }
    
    // Final pass: ensure all hotels have names
    for (let hotel of hotels) {
      if (!hotel.name || hotel.name.trim() === '') {
        hotel.name = `${city} Hotel #${Math.floor(Math.random() * 9999) + 1000}`;
        console.log(`Applied fallback name: ${hotel.name}`);
      }
    }
    
    return hotels;
  } catch (error) {
    console.error('Error enriching hotel names:', error.message);
    return hotels; // Return original hotels if enrichment completely fails
  }
}

async function fallbackNominatimSearch({ city, country }) {
  try {
    console.log(`Using fallback Nominatim search for: ${city}, ${country}`);
    
    // First, get the city bounding box to use with Overpass
    const cityGeocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}${country ? ',' + encodeURIComponent(country) : ''}&format=json&limit=1&timeout=10`,
      {
        headers: {
          'User-Agent': 'AmicusServices-HotelSearch/1.0'
        }
      }
    );
    
    if (cityGeocodeResponse.ok) {
      const cityData = await cityGeocodeResponse.json();
      if (cityData && cityData.length > 0) {
        const cityLat = parseFloat(cityData[0].lat);
        const cityLon = parseFloat(cityData[0].lon);
        
        // Try Overpass API with better query (1 degree ≈ 111 km)
        try {
          const overpassQuery = `
            [bbox:${cityLat-1.0},${cityLon-1.0},${cityLat+1.0},${cityLon+1.0}];
            (
              node["name"]["tourism"~"hotel|guest_house|hostel"];
              way["name"]["tourism"~"hotel|guest_house|hostel"];
            );
            out center;
          `;
          
          const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: { 'User-Agent': 'AmicusServices-HotelSearch/1.0' }
          });
          
          if (overpassResponse.ok) {
            const osmData = await overpassResponse.json();
            if (osmData.elements && osmData.elements.length > 0) {
              console.log(`Found ${osmData.elements.length} hotels via Overpass`);
              return (osmData.elements || [])
                .filter(elem => elem.tags && elem.tags.name && (elem.lat || (elem.center && elem.center.lat)))
                .slice(0, 50)
                .map((elem, idx) => {
                  const lat = elem.center ? elem.center.lat : elem.lat;
                  const lon = elem.center ? elem.center.lon : elem.lon;
                  const hotelName = elem.tags.name;
                  
                  let website = '#';
                  if (elem.tags.website) {
                    website = elem.tags.website;
                    if (!website.startsWith('http')) website = 'https://' + website;
                  } else {
                    const encodedName = encodeURIComponent(hotelName);
                    const location = encodeURIComponent(city + (country ? ', ' + country : ''));
                    website = `https://www.google.com/search?q=${encodedName}+${location}`;
                  }
                  
                  console.log(`✓ Overpass hotel: "${hotelName}"`);
                  return {
                    id: elem.id || `osm-${idx}`,
                    name: hotelName,
                    city: city,
                    country: country,
                    lat: parseFloat(lat),
                    lon: parseFloat(lon),
                    description: elem.tags.description || `Hotel in ${city}`,
                    stars: parseInt(elem.tags.stars) || 3,
                    amenities: ['eco-friendly', 'sustainable'],
                    leed: true,
                    image: 'images/bg_1.jpg',
                    website: website
                  };
                });
            }
          }
        } catch (e) {
          console.log('Overpass failed, falling back to Nominatim:', e.message);
        }
      }
    }
    
    // Fallback to Nominatim search
    console.log('Using Nominatim direct search...');
    const hotelSearchResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}${country ? ',' + encodeURIComponent(country) : ''}&format=json&limit=100&timeout=10`,
      {
        headers: {
          'User-Agent': 'AmicusServices-HotelSearch/1.0'
        }
      }
    );
    
    if (!hotelSearchResponse.ok) {
      return [];
    }
    
    const hotelData = await hotelSearchResponse.json();
    
    const hotels = (hotelData || [])
      .filter(h => {
        if (!h.name || h.name.length < 3) return false;
        if (h.name.toLowerCase() === 'hotel') return false;
        if (!h.lat || !h.lon) return false;
        
        const isHotel = h.type === 'hotel' || 
                       h.type === 'guest_house' || 
                       h.type === 'alpine_hut' ||
                       h.type === 'hostel' ||
                       h.type === 'apartment' ||
                       h.class === 'tourism' ||
                       h.class === 'amenity' ||
                       (h.name && (h.name.toLowerCase().includes('hotel') || 
                                   h.name.toLowerCase().includes('resort') ||
                                   h.name.toLowerCase().includes('inn') ||
                                   h.name.toLowerCase().includes('hostel')));
        return isHotel;
      })
      .slice(0, 100)
      .map((elem, idx) => {
        let website = '#';
        
        // Prioritize direct website if available
        if (elem.extratags && elem.extratags.website) {
          website = elem.extratags.website;
          if (!website.startsWith('http')) {
            website = 'https://' + website;
          }
        } else {
          // Use Google Maps search for better hotel discovery and verification
          const hotelName = encodeURIComponent(elem.name);
          const location = encodeURIComponent(city + (country ? ', ' + country : ''));
          website = `https://www.google.com/maps/search/${hotelName}+${location}`;
        }
        
        console.log(`✓ Nominatim hotel: "${elem.name}"`);
        return {
          id: elem.osm_id || idx,
          name: elem.name || `Hotel ${idx + 1}`,
          city: city,
          country: country,
          lat: parseFloat(elem.lat),
          lon: parseFloat(elem.lon),
          description: elem.address?.road || `Hotel in ${city}`,
          stars: 3,
          amenities: ['eco-friendly', 'sustainable'],
          leed: true,
          image: 'images/bg_1.jpg',
          website: website
        };
      });
    
    console.log(`Nominatim returned ${hotels.length} hotels`);
    return hotels;

  } catch (error) {
    console.error('Fallback hotel search error:', error.message);
    return [];
  }
}
