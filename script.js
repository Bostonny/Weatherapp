const apiKey = (window.CONFIG && window.CONFIG.OPENWEATHER_API_KEY) || '';

// Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast');
const errorMessage = document.getElementById('error-message');

// API URL for Current Weather
const weatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=';

// API URL for 5-day forecast
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?q=';

// Function to fetch weather data
function getWeatherData(city) {
    if (!apiKey) {
        showError('Missing API key. Please create config.js with your OpenWeather API key.');
        return;
    }
    const weatherRequestUrl = `${weatherUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    fetch(weatherRequestUrl)
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data && data.message ? data.message : 'Request failed');
            }
            return data;
        })
        .then(data => {
            displayWeatherData(data);
            get5DayForecast(city);
            clearError();
        })
        .catch((err) => {
            showError(`Error fetching data: ${err.message || 'Please try again later.'}`);
        });
}

// Function to fetch 5-day weather forecast
function get5DayForecast(city) {
    if (!apiKey) {
        return; // Error already shown by getWeatherData
    }
    const forecastRequestUrl = `${forecastUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    fetch(forecastRequestUrl)
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data && data.message ? data.message : 'Request failed');
            }
            return data;
        })
        .then(data => {
            display5DayForecast(data);
        })
        .catch((err) => {
            showError(`Error fetching forecast data: ${err.message || ''}`);
        });
}

// Function to display weather data
function displayWeatherData(data) {
    const temp = data.main.temp;
    const weather = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    weatherInfo.innerHTML = `
        <div>
            <h2>${data.name}, ${data.sys.country}</h2>
            <img src="${icon}" alt="weather icon" class="weather-icon" />
            <p><strong>Temperature:</strong> ${temp}°C</p>
            <p><strong>Condition:</strong> ${weather}</p>
            <p><strong>Humidity:</strong> ${humidity}%</p>
            <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
        </div>
    `;
}

// Function to display 5-day forecast
function display5DayForecast(data) {
    forecastContainer.innerHTML = '';

    // Pick one forecast per day around midday when available
    const byNoon = (data.list || []).filter(item => item.dt_txt && item.dt_txt.includes('12:00:00'));
    const representative = byNoon.length >= 5
        ? byNoon.slice(0, 5)
        : (data.list || []).filter((_, idx) => idx % 8 === 0).slice(0, 5);

    representative.forEach((forecast) => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        const temp = forecast.main.temp;
        const weather = forecast.weather[0].description;
        const icon = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`;

        const forecastElement = document.createElement('div');
        forecastElement.classList.add('forecast-day');
        forecastElement.innerHTML = `
            <p><strong>${date}</strong></p>
            <img src="${icon}" alt="weather icon" />
            <p>${weather}</p>
            <p>${temp}°C</p>
        `;
        forecastContainer.appendChild(forecastElement);
    });
}

// Function to show error message
function showError(message) {
    errorMessage.style.display = 'block';
    errorMessage.innerText = message;
}

// Function to clear error message
function clearError() {
    errorMessage.style.display = 'none';
}

// Event listener for search button
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    } else {
        showError('Please enter a city name.');
    }
});

// Optional: Geolocation feature (auto-fetch weather for user location)
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const geolocationUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        fetch(geolocationUrl)
            .then(response => response.json())
            .then(data => {
                displayWeatherData(data);
                get5DayForecast(data.name);
            })
            .catch(() => {
                // Silent fail for geolocation fetch; no UI disruption
            });
    }, () => {
        // User denied or error; do nothing
    });
}
