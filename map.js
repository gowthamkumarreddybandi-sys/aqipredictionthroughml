// map.js
// Expects global variables: citiesData, waqiToken

const map = L.map('map').setView([20, 78], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Leaflet.heat layer for India AQI (added before circle markers)
const heatData = citiesData
    .filter(c => c.type === 'india' && c.AQI !== null && c.AQI !== undefined)
    .map(c => [c.Latitude, c.Longitude, Math.min(c.AQI / 400, 1.0)]);

const heatLayer = L.heatLayer(heatData, {
    radius: 40,
    blur: 30,
    maxZoom: 8,
    gradient: {
        0.0: '#00e400',
        0.25: '#ffff00',
        0.5: '#ff7e00',
        0.75: '#ff0000',
        1.0: '#8f3f97'
    }
});
heatLayer.addTo(map);

// Cache live AQI results for 5 minutes
const aqiCache = new Map();

function getAQIquality(aqi) {
    if (aqi === null || aqi === undefined || isNaN(aqi)) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
}

function formatValue(value, digits = 1) {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return Number(value).toFixed(digits);
}

function getMarkerRadius(city) {
    if (city.type === 'ireland') return 10;
    if (city.type === 'eu_country') return 9;
    return 8;
}

function getMarkerColor(city) {
    if (city.type === 'india') {
        const aqi = city.AQI;
        if (aqi === null || aqi === undefined || isNaN(aqi)) return '#9E9E9E';
        if (aqi <= 50) return '#00ff00';
        if (aqi <= 100) return '#ffff00';
        if (aqi <= 200) return '#ffa500';
        if (aqi <= 300) return '#ff0000';
        return '#800080';
    }

    if (city.type === 'ireland') {
        const aqi = city.AQI;
        if (aqi === null || aqi === undefined || isNaN(aqi)) return '#3F51B5';
        if (aqi <= 50) return '#00ff00';
        if (aqi <= 100) return '#ffff00';
        if (aqi <= 200) return '#ffa500';
        if (aqi <= 300) return '#ff0000';
        return '#800080';
    }

    if (city.type === 'eu_country') {
        return '#1E88E5';
    }

    if (city.type === 'world') {
        return '#455A64';
    }

    return '#a0a0a0';
}

async function fetchLiveAQIByCity(cityName) {
    if (!waqiToken) return null;

    const cacheKey = `city:${cityName}`;
    const cached = aqiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 300000) {
        return cached.data;
    }

    try {
        const response = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=${waqiToken}`);
        const data = await response.json();

        if (data.status === 'ok') {
            aqiCache.set(cacheKey, { data: data.data, timestamp: Date.now() });
            return data.data;
        }
    } catch (e) {
        console.error('WAQI city fetch error:', e);
    }

    return null;
}

async function fetchLiveAQIByGeo(lat, lon) {
    if (!waqiToken) return null;

    const cacheKey = `geo:${lat},${lon}`;
    const cached = aqiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 300000) {
        return cached.data;
    }

    try {
        const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${waqiToken}`);
        const data = await response.json();

        if (data.status === 'ok') {
            aqiCache.set(cacheKey, { data: data.data, timestamp: Date.now() });
            return data.data;
        }
    } catch (e) {
        console.error('WAQI geo fetch error:', e);
    }

    return null;
}

function buildLiveOnlyPopup(cityName, flag, liveData) {
    if (liveData) {
        return `
            <b>${flag} ${cityName}</b><br>
            <b>Live AQI:</b> ${liveData.aqi} (${getAQIquality(liveData.aqi)})<br>
            PM2.5: ${liveData.iaqi?.pm25?.v ?? 'N/A'}<br>
            PM10: ${liveData.iaqi?.pm10?.v ?? 'N/A'}<br>
            O₃: ${liveData.iaqi?.o3?.v ?? 'N/A'}<br>
            NO₂: ${liveData.iaqi?.no2?.v ?? 'N/A'}<br>
            SO₂: ${liveData.iaqi?.so2?.v ?? 'N/A'}<br>
            CO: ${liveData.iaqi?.co?.v ?? 'N/A'}
        `;
    }

    return `
        <b>${flag} ${cityName}</b><br>
        ${waqiToken ? 'Live data unavailable' : '⚠️ Enter WAQI Token in sidebar'}
    `;
}

function buildIndiaHistoricalPopup(city) {
    const aqi = formatValue(city.AQI, 0);
    const quality = city.AQI !== null && city.AQI !== undefined && !isNaN(city.AQI)
        ? getAQIquality(city.AQI)
        : 'N/A';

    return `
        <b>🇮🇳 ${city.City}</b><br>
        <b>Historical Avg AQI:</b> ${aqi} (${quality})<br>
        PM2.5: ${formatValue(city.pm25, 1)}<br>
        PM10: ${formatValue(city.pm10, 1)}<br>
        O₃: ${formatValue(city.o3, 1)}<br>
        NO₂: ${formatValue(city.no2, 1)}<br>
        SO₂: ${formatValue(city.so2, 1)}<br>
        CO: ${formatValue(city.co, 2)}
    `;
}

function buildIndiaCombinedPopup(city, liveData) {
    const histAQI = formatValue(city.AQI, 0);
    const histQuality = city.AQI !== null && city.AQI !== undefined && !isNaN(city.AQI)
        ? getAQIquality(city.AQI)
        : 'N/A';

    if (liveData) {
        return `
            <b>🇮🇳 ${city.City}</b><br>
            <b>Historical Avg AQI:</b> ${histAQI} (${histQuality})<br>
            <b>Live AQI:</b> ${liveData.aqi} (${getAQIquality(liveData.aqi)})<br>
            <hr style="margin:6px 0;">
            <b>Live Pollutants</b><br>
            PM2.5: ${liveData.iaqi?.pm25?.v ?? 'N/A'}<br>
            PM10: ${liveData.iaqi?.pm10?.v ?? 'N/A'}<br>
            O₃: ${liveData.iaqi?.o3?.v ?? 'N/A'}<br>
            NO₂: ${liveData.iaqi?.no2?.v ?? 'N/A'}<br>
            SO₂: ${liveData.iaqi?.so2?.v ?? 'N/A'}<br>
            CO: ${liveData.iaqi?.co?.v ?? 'N/A'}<br>
            <hr style="margin:6px 0;">
            <b>Historical Avg Pollutants</b><br>
            PM2.5: ${formatValue(city.pm25, 1)}<br>
            PM10: ${formatValue(city.pm10, 1)}<br>
            O₃: ${formatValue(city.o3, 1)}<br>
            NO₂: ${formatValue(city.no2, 1)}<br>
            SO₂: ${formatValue(city.so2, 1)}<br>
            CO: ${formatValue(city.co, 2)}
        `;
    }

    return `
        <b>🇮🇳 ${city.City}</b><br>
        <b>Historical Avg AQI:</b> ${histAQI} (${histQuality})<br>
        <small>${waqiToken ? 'Live data unavailable for this city' : '⚠️ Enter WAQI Token for live data'}</small><br>
        <hr style="margin:6px 0;">
        <b>Historical Avg Pollutants</b><br>
        PM2.5: ${formatValue(city.pm25, 1)}<br>
        PM10: ${formatValue(city.pm10, 1)}<br>
        O₃: ${formatValue(city.o3, 1)}<br>
        NO₂: ${formatValue(city.no2, 1)}<br>
        SO₂: ${formatValue(city.so2, 1)}<br>
        CO: ${formatValue(city.co, 2)}
    `;
}

function buildEUCountryPopup(city, liveData) {
    if (liveData) {
        return `
            <b>🇪🇺 ${city.Country}</b><br>
            <b>Capital:</b> ${city.City}<br>
            <b>Live AQI:</b> ${liveData.aqi} (${getAQIquality(liveData.aqi)})<br>
            PM2.5: ${liveData.iaqi?.pm25?.v ?? 'N/A'}<br>
            PM10: ${liveData.iaqi?.pm10?.v ?? 'N/A'}<br>
            O₃: ${liveData.iaqi?.o3?.v ?? 'N/A'}<br>
            NO₂: ${liveData.iaqi?.no2?.v ?? 'N/A'}<br>
            SO₂: ${liveData.iaqi?.so2?.v ?? 'N/A'}<br>
            CO: ${liveData.iaqi?.co?.v ?? 'N/A'}
        `;
    }

    return `
        <b>🇪🇺 ${city.Country}</b><br>
        <b>Capital:</b> ${city.City}<br>
        ${waqiToken ? 'Live data unavailable' : '⚠️ Enter WAQI Token in sidebar'}
    `;
}

citiesData.forEach(city => {
    const isIndia = city.type === 'india';
    const isIreland = city.type === 'ireland';
    const isWorld = city.type === 'world';
    const isEUCountry = city.type === 'eu_country';

    const marker = L.circleMarker([city.Latitude, city.Longitude], {
        radius: getMarkerRadius(city),
        fillColor: getMarkerColor(city),
        color: isIreland ? '#0D47A1' : '#000',
        weight: isIreland ? 2 : 1,
        fillOpacity: 0.85
    }).addTo(map);

    if (isIndia) {
        marker.bindTooltip(
            `<b>${city.City}</b><br>Historical Avg AQI: ${formatValue(city.AQI, 0)}`,
            { permanent: false, direction: 'top' }
        );
    } else if (isIreland) {
        marker.bindTooltip(
            `<b>🍀 ${city.City}</b><br>Click for live AQI`,
            { permanent: false, direction: 'top' }
        );
    } else if (isEUCountry) {
        marker.bindTooltip(
            `<b>🇪🇺 ${city.Country}</b><br>${city.City}<br>Click for live AQI`,
            { permanent: false, direction: 'top' }
        );
    } else if (isWorld) {
        marker.bindTooltip(
            `<b>🌍 ${city.City}</b><br>Click for live AQI`,
            { permanent: false, direction: 'top' }
        );
    }

    if (isIndia) {
        marker.on('click', async function () {
            marker.bindPopup(`
                <b>🇮🇳 ${city.City}</b><br>
                <b>Historical Avg AQI:</b> ${formatValue(city.AQI, 0)}
                (${city.AQI !== null && city.AQI !== undefined && !isNaN(city.AQI) ? getAQIquality(city.AQI) : 'N/A'})<br>
                <hr style="margin:6px 0;">
                ⏳ Fetching live AQI...
            `).openPopup();

            const liveData = await fetchLiveAQIByGeo(city.Latitude, city.Longitude);
            marker.bindPopup(buildIndiaCombinedPopup(city, liveData)).openPopup();
        });
    } else if (isIreland) {
        marker.on('click', async function () {
            marker.bindPopup(`<b>🍀 ${city.City}</b><br>⏳ Fetching live AQI...`).openPopup();
            const liveData = await fetchLiveAQIByCity(city.City);
            marker.bindPopup(buildLiveOnlyPopup(city.City, '🍀', liveData)).openPopup();
        });
    } else if (isWorld) {
        marker.on('click', async function () {
            marker.bindPopup(`<b>🌍 ${city.City}</b><br>⏳ Fetching live AQI...`).openPopup();
            const liveData = await fetchLiveAQIByCity(city.City);
            marker.bindPopup(buildLiveOnlyPopup(city.City, '🌍', liveData)).openPopup();
        });
    } else if (isEUCountry) {
        marker.on('click', async function () {
            marker.bindPopup(`
                <b>🇪🇺 ${city.Country}</b><br>
                <b>Capital:</b> ${city.City}<br>
                ⏳ Fetching live AQI...
            `).openPopup();

            const liveData = await fetchLiveAQIByGeo(city.Latitude, city.Longitude);
            marker.bindPopup(buildEUCountryPopup(city, liveData)).openPopup();
        });
    }
});
