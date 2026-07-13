import pandas as pd
import numpy as np

ireland = [
    {"County": "Carlow", "Latitude": 52.8414, "Longitude": -6.9320},
    {"County": "Cavan", "Latitude": 54.0105, "Longitude": -7.3529},
    {"County": "Clare", "Latitude": 52.8668, "Longitude": -9.0705},
    {"County": "Cork", "Latitude": 51.8985, "Longitude": -8.4756},
    {"County": "Donegal", "Latitude": 54.6597, "Longitude": -8.1150},
    {"County": "Dublin", "Latitude": 53.3498, "Longitude": -6.2603},
    {"County": "Galway", "Latitude": 53.2707, "Longitude": -9.0568},
    {"County": "Kerry", "Latitude": 52.1542, "Longitude": -9.7091},
    {"County": "Kildare", "Latitude": 53.2129, "Longitude": -6.6917},  # Maynooth!
    {"County": "Kilkenny", "Latitude": 52.6543, "Longitude": -7.2516},
    {"County": "Laois", "Latitude": 52.9985, "Longitude": -7.2633},
    {"County": "Leitrim", "Latitude": 54.2000, "Longitude": -8.0000},
    {"County": "Limerick", "Latitude": 52.6580, "Longitude": -8.6280},
    {"County": "Longford", "Latitude": 53.7270, "Longitude": -7.5850},
    {"County": "Louth", "Latitude": 53.7530, "Longitude": -6.5000},
    {"County": "Mayo", "Latitude": 53.9170, "Longitude": -9.4310},
    {"County": "Meath", "Latitude": 53.5700, "Longitude": -6.6500},
    {"County": "Monaghan", "Latitude": 54.2500, "Longitude": -7.0000},
    {"County": "Offaly", "Latitude": 53.2700, "Longitude": -7.7200},
    {"County": "Roscommon", "Latitude": 53.6300, "Longitude": -8.1900},
    {"County": "Sligo", "Latitude": 54.2700, "Longitude": -8.4800},
    {"County": "Tipperary", "Latitude": 52.6500, "Longitude": -8.1500},
    {"County": "Waterford", "Latitude": 52.2600, "Longitude": -7.5000},
    {"County": "Westmeath", "Latitude": 53.5400, "Longitude": -7.4700},
    {"County": "Wexford", "Latitude": 52.3400, "Longitude": -6.4600},
    {"County": "Wicklow", "Latitude": 52.9800, "Longitude": -6.3000}
]

df = pd.DataFrame(ireland)
df['AQI'] = np.nan  # Live fetch
df['type'] = 'ireland'
df.to_csv("ireland_counties.csv", index=False)
print("✅ ireland_counties.csv created (26 counties)!")
