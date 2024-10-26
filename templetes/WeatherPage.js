const metrosIndia = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Kolkata", "Hyderabad"];
const intervalMinutes = 5; // Set the interval in minutes for continuous fetching


async function getWeather(city,idName) {

    const cachedData = localStorage.getItem(city);
    const currentTime = new Date().getTime();
    const intervalMilliseconds = intervalMinutes * 60 * 1000;

    if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Check if the cached data is within the interval limit
        if (currentTime - parsedData.timestamp < intervalMilliseconds) {
            // Use cached data
            displayWeatherData(parsedData.data, idName);
            return;
        }
    }

    const url = 'http://127.0.0.1:5000/weather/';
    const new_url = `${url}${encodeURIComponent(city)}`;

    try {
        const response = await fetch(new_url);
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.status);
        }
        
        const data = await response.json();
        console.log(data);

        localStorage.setItem(city, JSON.stringify({ data: data, timestamp: currentTime }));

        displayWeatherData(data, idName);

    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function displayWeatherData(data, idName){
    const cityReports = document.getElementById(idName);
    cityReports.innerHTML = '';  
    cityReports.className = 'weatherBox';

    const cityName = document.createElement('h2');
    cityName.textContent = data['Name'];
    cityName.className='city-name'

    const regionName = document.createElement('p');
    regionName.textContent = data['Region'] + ", " + data['Country'];
    regionName.className = 'location-info';

    const tempC = document.createElement('div');
    tempC.textContent =  data['TemperatureC'] + "°C / "+ data['TemperatureF']+"°F / "+data['TemperatureK']+"°K";
    tempC.className = 'temp-box';

    const AlertBox=document.createElement('div');
    AlertBox.className='alert-box';

    const msgBox=document.createElement('p');
    msgBox.className='alert-display';

    if(data['Alert']!='Normal'){
        const msgBox=document.createElement('p');
        msgBox.textContent=data['Alert'];
        
    }

    const iconBox = document.createElement('div');
    iconBox.className = 'icon-box';

    const weatherIcon = document.createElement('img');
    weatherIcon.src = "http:" + data['IconURL'];
    weatherIcon.alt = 'Weather Icon';
    weatherIcon.className = 'weather-icon';
    
    const weatherInfo = document.createElement('p');
    weatherInfo.textContent = data['Weather'];
    weatherInfo.className = 'weather-info';

    const cityTime = document.createElement('div');
    cityTime.textContent = "Time: " + convertTo12Hour(data['Time'].slice(10));
    cityTime.className = 'time';

    const humidity = document.createElement('div');
    humidity.textContent = "Humidity: " + data['Humidity'] + "%  ";
    humidity.className = 'humidity';

    const windSpeed = document.createElement('div');
    windSpeed.textContent = "Wind: " + data['Wind'] + " Km/h  ";
    windSpeed.className = 'wind-speed';

    const details = document.createElement('div');
    details.className = 'details';
    details.appendChild(cityTime);
    details.appendChild(humidity);
    details.appendChild(windSpeed);

    iconBox.appendChild(weatherIcon);

    cityReports.appendChild(cityName);
    cityReports.appendChild(regionName);
    cityReports.appendChild(tempC);
    cityReports.appendChild(iconBox);

    AlertBox.appendChild(msgBox);
    
    cityReports.appendChild(AlertBox);
    cityReports.appendChild(weatherInfo);
    cityReports.appendChild(details);
}

document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        showLoaderAndFetchWeather();
    }
});

const searchButton = document.getElementById('searchButton');
const loader = document.getElementById('loader');

async function showLoaderAndFetchWeather() {
    loader.style.display = 'block'; 
    try {
        const city = searchInput.value.trim();
        await getWeather(city,'main-weather');  
    } catch (error) {
        console.error('Error loading weather data:', error);
    } finally {
        loader.style.display = 'none'; 
    }
}

searchButton.addEventListener('click', showLoaderAndFetchWeather);

// Function to fetch weather data for all metro cities
async function getWeatherForMetros() {
    const metroReports = document.getElementById('metreos-india');
    metroReports.innerHTML = '';  // Clear previous data

    for (const city of metrosIndia) {
        const cityDiv = document.createElement('div');
        cityDiv.className = 'city-weather-box';
        cityDiv.id = `${city}-weather`; // Assign a unique ID for each city's weather div

        metroReports.appendChild(cityDiv);
        await getWeather(city, cityDiv.id);
    }
}

// Function to continuously fetch the weather data every set interval
function fetchWeatherContinuously(intervalMinutes) {
    getWeatherForMetros(); // Initial fetch
    setInterval(getWeatherForMetros, intervalMinutes * 60 * 1000); // Fetch every intervalMinutes
}

// Fetch weather data as soon as the site loads
window.onload = function() {
    fetchWeatherContinuously(intervalMinutes); // Start continuous fetching
};

function convertTo12Hour(time24) {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; 
    const minuteFormatted = minute.toString().padStart(2, '0');
    return `${hour12}:${minuteFormatted} ${period}`;
}

