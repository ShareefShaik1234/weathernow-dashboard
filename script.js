// App State (Holds live API data in the same shape as Week 2)
let weatherData = null;
let currentUnit = "C"; // "C" or "F"

// DOM Elements
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const statusMessage = document.getElementById("status-message");
const currentCityEl = document.getElementById("current-city");
const currentConditionEl = document.getElementById("current-condition");
const currentEmojiEl = document.getElementById("current-emoji");
const currentTempEl = document.getElementById("current-temp");
const currentWindEl = document.getElementById("current-wind");
const currentHumidityEl = document.getElementById("current-humidity");
const forecastRowEl = document.getElementById("forecast-row");
const unitToggleBtn = document.getElementById("unit-toggle");

// 1. Helper Functions
function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

function formatTemp(celsius) {
  const value = currentUnit === "C" ? Math.round(celsius) : toFahrenheit(celsius);
  return `${value}°${currentUnit}`;
}

// Map Open-Meteo WMO weather codes to emoji, text, and theme
function getWeatherInfo(code) {
  if (code === 0) {
    return { emoji: "☀️", text: "Clear Sky", theme: "sunny" };
  }
  if (code >= 1 && code <= 3) {
    return { emoji: "⛅", text: "Partly Cloudy", theme: "cloudy" };
  }
  if (code === 45 || code === 48) {
    return { emoji: "🌫️", text: "Foggy", theme: "cloudy" };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { emoji: "🌧️", text: "Rainy", theme: "rain" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { emoji: "❄️", text: "Snow", theme: "snow" };
  }
  if (code >= 95 && code <= 99) {
    return { emoji: "⛈️", text: "Thunderstorm", theme: "rain" };
  }
  return { emoji: "🌤️", text: "Fair Weather", theme: "cloudy" };
}

function getWeatherEmoji(code) {
  return getWeatherInfo(code).emoji;
}

function formatDayName(dateString) {
  // Append T00:00:00 so local timezone parsing never shifts the day backward
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function applyTheme(theme) {
  document.body.classList.remove(
    "theme-sunny",
    "theme-cloudy",
    "theme-rain",
    "theme-snow"
  );
  if (theme) {
    document.body.classList.add(`theme-${theme}`);
  }
}

function showStatus(msg, type = "error") {
  statusMessage.className = "status-message";
  if (!msg) {
    statusMessage.textContent = "";
    return;
  }
  statusMessage.textContent = msg;
  statusMessage.classList.add(type); // "loading" or "error"
}

function setLoadingState(isLoading) {
  searchBtn.disabled = isLoading;
  locationBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching..." : "Search";
  if (isLoading) {
    showStatus("Loading live weather data...", "loading");
  }
}

// 2. Open-Meteo API Functions
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to reach geocoding service.");
  }

  const data = await response.json();
  console.log("Geocoding JSON:", data);

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const place = data.results[0];
  const displayName = place.country_code
    ? `${place.name}, ${place.country_code}`
    : place.name;

  return {
    name: displayName,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch weather forecast.");
  }

  const data = await response.json();
  console.log("Forecast JSON:", data);
  return data;
}

// Map Open-Meteo response into the clean dashboard data shape
function mapApiToWeatherShape(displayName, apiData) {
  const info = getWeatherInfo(apiData.current.weather_code);

  const dailyList = apiData.daily.time.map((dateStr, index) => ({
    date: dateStr,
    weatherCode: apiData.daily.weather_code[index],
    maxC: apiData.daily.temperature_2m_max[index],
    minC: apiData.daily.temperature_2m_min[index],
  }));

  return {
    current: {
      city: displayName,
      tempC: apiData.current.temperature_2m,
      weatherCode: apiData.current.weather_code,
      conditionText: info.text,
      theme: info.theme,
      windKmh: Math.round(apiData.current.wind_speed_10m),
      humidity: apiData.current.relative_humidity_2m,
    },
    daily: dailyList,
  };
}

// 3. Render Functions
function renderCurrent(currentData) {
  currentCityEl.textContent = currentData.city;
  currentConditionEl.textContent = currentData.conditionText;
  currentEmojiEl.textContent = getWeatherEmoji(currentData.weatherCode);
  currentTempEl.textContent = formatTemp(currentData.tempC);
  currentWindEl.textContent = `${currentData.windKmh} km/h`;
  currentHumidityEl.textContent = `${currentData.humidity}%`;

  unitToggleBtn.textContent =
    currentUnit === "C" ? "Switch to °F" : "Switch to °C";

  applyTheme(currentData.theme);
}

function renderForecast(days) {
  forecastRowEl.innerHTML = days
    .map(
      (day) => `
      <article class="forecast-card">
        <span class="forecast-day">${formatDayName(day.date)}</span>
        <span class="forecast-icon" aria-hidden="true">${getWeatherEmoji(
          day.weatherCode
        )}</span>
        <div class="forecast-temps">
          <span class="temp-max">${formatTemp(day.maxC)}</span>
          <span class="temp-min">${formatTemp(day.minC)}</span>
        </div>
      </article>
    `
    )
    .join("");
}

function renderDashboard() {
  if (!weatherData) return;
  renderCurrent(weatherData.current);
  renderForecast(weatherData.daily);
}

// 4. Main Search Controller
async function loadCityWeather(cityQuery) {
  setLoadingState(true);
  try {
    const location = await getCoordinates(cityQuery);

    if (!location) {
      showStatus(`City not found: "${cityQuery}". Please check the spelling.`, "error");
      return;
    }

    const rawWeather = await getWeather(location.latitude, location.longitude);
    weatherData = mapApiToWeatherShape(location.name, rawWeather);
    showStatus("");
    renderDashboard();
  } catch (error) {
    console.error("Weather fetch error:", error);
    showStatus(
      "Network error: Unable to fetch live weather. Check your internet connection and try again.",
      "error"
    );
  } finally {
    setLoadingState(false);
  }
}

// 5. Event Listeners
unitToggleBtn.addEventListener("click", () => {
  currentUnit = currentUnit === "C" ? "F" : "C";
  renderDashboard();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    showStatus("Please enter a city name before searching.", "error");
    return;
  }

  loadCityWeather(query);
  cityInput.value = "";
});

// Stretch Goal: Use My Current Location via Geolocation API
locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Geolocation is not supported by your browser.", "error");
    return;
  }

  setLoadingState(true);
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const rawWeather = await getWeather(latitude, longitude);
        weatherData = mapApiToWeatherShape("My Current Location", rawWeather);
        showStatus("");
        renderDashboard();
      } catch (error) {
        console.error("Geolocation weather error:", error);
        showStatus("Network error while fetching weather for your location.", "error");
      } finally {
        setLoadingState(false);
      }
    },
    () => {
      setLoadingState(false);
      showStatus("Location access denied. Please search for a city manually.", "error");
    }
  );
});

// Initial Live Weather Load on Page Open
loadCityWeather("Madanapalle");