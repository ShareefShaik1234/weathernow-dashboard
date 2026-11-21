// 1. Sample Weather Data (All temperatures stored in Celsius)
const sampleWeather = {
  current: {
    city: "Madanapalle, IN",
    tempC: 26,
    condition: "partly-cloudy",
    conditionText: "Partly Cloudy",
    windKmh: 14,
    humidity: 62,
  },
  daily: [
    { date: "2026-11-19", condition: "sunny", maxC: 28, minC: 18 },
    { date: "2026-11-20", condition: "partly-cloudy", maxC: 27, minC: 17 },
    { date: "2026-11-21", condition: "rain", maxC: 24, minC: 16 },
    { date: "2026-11-22", condition: "drizzle", maxC: 25, minC: 16 },
    { date: "2026-11-23", condition: "sunny", maxC: 29, minC: 18 },
    { date: "2026-11-24", condition: "sunny", maxC: 30, minC: 19 },
    { date: "2026-11-25", condition: "cloudy", maxC: 26, minC: 17 },
  ],
};

// App State
let currentUnit = "C"; // "C" or "F"

// DOM Elements
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusMessage = document.getElementById("status-message");
const currentCityEl = document.getElementById("current-city");
const currentConditionEl = document.getElementById("current-condition");
const currentEmojiEl = document.getElementById("current-emoji");
const currentTempEl = document.getElementById("current-temp");
const currentWindEl = document.getElementById("current-wind");
const currentHumidityEl = document.getElementById("current-humidity");
const forecastRowEl = document.getElementById("forecast-row");
const unitToggleBtn = document.getElementById("unit-toggle");

// 2. Helper Functions
function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

function formatTemp(celsius) {
  const value = currentUnit === "C" ? Math.round(celsius) : toFahrenheit(celsius);
  return `${value}°${currentUnit}`;
}

function getWeatherEmoji(condition) {
  const map = {
    sunny: "☀️",
    "partly-cloudy": "⛅",
    cloudy: "☁️",
    rain: "🌧️",
    drizzle: "🌦️",
    storm: "⛈️",
  };
  return map[condition.toLowerCase()] || "🌤️";
}

function formatDayName(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", { weekday: "short" });
}

function applyTheme(condition) {
  document.body.classList.remove("theme-sunny", "theme-cloudy", "theme-rain");
  const normalized = condition.toLowerCase();
  if (normalized === "sunny") {
    document.body.classList.add("theme-sunny");
  } else if (normalized.includes("cloud")) {
    document.body.classList.add("theme-cloudy");
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    document.body.classList.add("theme-rain");
  }
}

function showStatus(msg) {
  if (!msg) {
    statusMessage.textContent = "";
    statusMessage.classList.remove("visible");
    return;
  }
  statusMessage.textContent = msg;
  statusMessage.classList.add("visible");
}

// 3. Render Functions
function renderCurrent(currentData) {
  currentCityEl.textContent = currentData.city;
  currentConditionEl.textContent = currentData.conditionText;
  currentEmojiEl.textContent = getWeatherEmoji(currentData.condition);
  currentTempEl.textContent = formatTemp(currentData.tempC);
  currentWindEl.textContent = `${currentData.windKmh} km/h`;
  currentHumidityEl.textContent = `${currentData.humidity}%`;

  unitToggleBtn.textContent =
    currentUnit === "C" ? "Switch to °F" : "Switch to °C";

  applyTheme(currentData.condition);
}

function renderForecast(days) {
  forecastRowEl.innerHTML = days
    .map(
      (day) => `
      <article class="forecast-card">
        <span class="forecast-day">${formatDayName(day.date)}</span>
        <span class="forecast-icon" aria-hidden="true">${getWeatherEmoji(day.condition)}</span>
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
  renderCurrent(sampleWeather.current);
  renderForecast(sampleWeather.daily);
}

// 4. Event Listeners
unitToggleBtn.addEventListener("click", () => {
  currentUnit = currentUnit === "C" ? "F" : "C";
  renderDashboard();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    showStatus("Please enter a city name before searching.");
    return;
  }

  showStatus("");
  sampleWeather.current.city = query;
  renderCurrent(sampleWeather.current);
  cityInput.value = "";
});

// Initial Render on Page Load
renderDashboard();