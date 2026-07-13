import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter  # ← CRITICAL FIX
import time
import os

# Load stations
stations = pd.read_csv("my_air_data/stations.csv")
unique_cities = stations[['City', 'State']].drop_duplicates().dropna()

print(f"Geocoding {len(unique_cities)} unique cities...")

# FIXED: Rate-limited geocoding (1 req/sec = Nominatim policy)
geolocator = Nominatim(user_agent="aqi_project_v2")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

coords = []
for idx, row in unique_cities.iterrows():
    city = row['City']
    state = row['State'] if pd.notna(row['State']) else ""
    query = f"{city}, {state}, India" if state else f"{city}, India"
    
    try:
        print(f"Geocoding: {query}")
        location = geocode(query)
        if location:
            coords.append({
                'City': city,
                'Latitude': round(location.latitude, 6),
                'Longitude': round(location.longitude, 6)
            })
            print(f"  ✓ {city}: {location.latitude:.4f}, {location.longitude:.4f}")
        else:
            print(f"  ✗ {city}: Not found")
    except Exception as e:
        print(f"  ! {city}: Error - {e}")

# Save coordinates
city_coords_df = pd.DataFrame(coords)
city_coords_df.to_csv("city_coords.csv", index=False)
print(f"\n✅ Saved {len(city_coords_df)} cities to city_coords.csv")
print("\nSample:")
print(city_coords_df.head())
