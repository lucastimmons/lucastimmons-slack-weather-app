const { App } = require('@slack/bolt');
const axios = require('axios'); // For making easy requests
require("dotenv").config(); // All the keys

// Initializes your app with your bot token and app token
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

// Listens for any message and returns the input box asking the user to select a city. 
app.message('', async({ message, say }) => {
    await say({
        "text": `Hi <@${message.user}>. I can check the weather for you. Please type a city name in the input field below.`, // For screen readers or push notifications 
        "blocks": [{
            "dispatch_action": true,
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "action_id": "pick_a_city",
                "placeholder": {
                    "type": "plain_text",
                    "text": "Enter your city here"
                }
            },
            "label": {
                "type": "plain_text",
                "text": `Hi <@${message.user}>. I can check the weather for you. Please type a city name in the input field below.`,
                "emoji": false
            }
        }]
    });

});

// This handles the input from the box that happens in response to any message
app.action("pick_a_city", async({ body, ack, say }) => {
    await ack();

    try {
        let theResponse = await getWeather(body.actions[0].value); // Either returns the weather data or "Bad City" when it can't find the city the user has asked for

        if (theResponse == "Bad city") { // If the weather API can't find the city
            await say({
                "text": `Sorry, I can't find that city. Please try again.`
            })
        } else { // Display the weather
            // Converts the epoch time to a date humans like to read
            const day = theResponse.lastUpdatedTime.toLocaleString('default', {
                month: "long",
                day: "numeric"
            });
            // Converts the epoch time to a time humans like to read
            const time = theResponse.lastUpdatedTime.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

            // Cleans up sunrise and sunset 
            function cleanSun(time) {
                time = time.replace(/^0+/, '');
                time = time.replace("AM", 'a.m.');
                time = time.replace("PM", 'p.m.');
                return time;
            }

            // Here's the forecast
            await say({
                "text": `Here is your weather forcast.`,
                "blocks": [{
                        "type": "section", // The header block
                        "text": {
                            "type": "mrkdwn",
                            "text": "Here is your weather forcast for " + theResponse.city + ", " + theResponse.country + " on " + day + " as of " + time
                        }
                    },
                    { // The current conditions 
                        "type": "section",
                        "block_id": "currentWeather",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Current conditions:\n" +
                                theResponse.currentCondition + "\n" +
                                "Temperature: " + theResponse.currentTemp + " °C\n" +
                                "Feels like: " + theResponse.currentFeelsLike + " °C\n" +
                                "Humidity: " + theResponse.currentHumidity + " %\n" +
                                "Barometric Pressure: " + theResponse.currentPressure + " mbar \n" +
                                "Wind: " + theResponse.currentWindSpeed + " km/h " + theResponse.currentWindDirection + "\n"

                        },
                        "accessory": {
                            "type": "image",
                            "image_url": "https:" + theResponse.currentConditionIcon,
                            "alt_text": "Current weather condition is " + theResponse.currentCondition
                        }
                    },
                    {
                        "type": "divider"
                    },
                    { // Today's forecast
                        "type": "section",
                        "block_id": "forecast",
                        "fields": [{
                            "type": "mrkdwn",
                            "text": "Today:\n" +
                                "Day time max: " + theResponse.maxTemp + " °C\n" +
                                "Day time low: " + theResponse.minTemp + " °C\n" +
                                "Average temperature: " + theResponse.avgTemp + " °C\n" +
                                "Probability of Precipitation: " + theResponse.pop + " %\n" +
                                "Sunrise: " + cleanSun(theResponse.sunrise) + "\n" +
                                "Sunset: " + cleanSun(theResponse.sunset)
                        }]
                    }
                ]
            });
        }
    } catch (error) {
        console.error(error);
        await say({
            text: `Sorry, an error has occured. Please try again later.`
        });
    }
});

// This connects to the weather API and gets the forecast based on the user input for city. 
async function getWeather(city) {
    const options = {
        method: 'GET',
        url: 'https://weatherapi-com.p.rapidapi.com/forecast.json',
        params: {
            q: city,
            days: '1'
        },
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
        }
    };

    try {
        const response = await axios.request(options);
        let weathResponse = processWeather(response);
        return weathResponse;
    } catch (error) {
        //console.error(error);
        return "Bad city" // If it can't find the city, this will trigger the error code
    }

}

// Processes the API response and turns it into an easy to use object
async function processWeather(theWeather) {

    let weatherData = {};

    weatherData.city = theWeather.data.location.name;
    weatherData.country = theWeather.data.location.country;
    let updateTime = new Date(theWeather.data.current.last_updated_epoch * 1000);
    weatherData.lastUpdatedTime = updateTime; //update to user readable time

    //Current conditions
    weatherData.currentTemp = theWeather.data.current.temp_c;
    weatherData.currentFeelsLike = theWeather.data.current.feelslike_c;
    weatherData.currentCondition = theWeather.data.current.condition.text;
    weatherData.currentConditionIcon = theWeather.data.current.condition.icon;
    weatherData.currentWindSpeed = theWeather.data.current.wind_kph;
    weatherData.currentWindDirection = theWeather.data.current.wind_dir;
    weatherData.currentPressure = theWeather.data.current.pressure_mb;
    weatherData.currentHumidity = theWeather.data.current.humidity;
    weatherData.currentUV = theWeather.data.current.uv;

    //Forecast
    weatherData.maxTemp = theWeather.data.forecast.forecastday[0].day.maxtemp_c;
    weatherData.minTemp = theWeather.data.forecast.forecastday[0].day.mintemp_c;
    weatherData.avgTemp = theWeather.data.forecast.forecastday[0].day.avgtemp_c;
    weatherData.pop = theWeather.data.forecast.forecastday[0].day.daily_chance_of_rain;
    weatherData.sunrise = theWeather.data.forecast.forecastday[0].astro.sunrise;
    weatherData.sunset = theWeather.data.forecast.forecastday[0].astro.sunset;

    return weatherData;
}

(async() => {
    // Start the app using sockets
    await app.start(process.env.PORT || 3000);
})();