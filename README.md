
# lucastimmons-slack-weather-app

This is a basic Slack app which connects to weatherapi-com.p.rapidapi.com API to get a forecast. 

It is set up to run locally using a socket connection.

Dependencies:

        "@slack/bolt": "^3.13.3",
        "axios": "^1.4.0",
        "dotenv": "^16.3.1",
        "nodemon": "^3.0.1"

Nodemon is for development purposes only. It does not need to be included in production. 

All the requried keys (SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, SLACK_APP_TOKEN, RAPIDAPI_KEY, RAPIDAPI_HOST) are in a .env file and have not been included here. You will have to create the file yourself and include your own keys to run this software. Email lucas@lucasimmons.com for a copy of the RapidAPI keys for testing. 

When the app is running in your instance, send the bot user an IM to get started. 

## Screenshots

![App Screenshot](https://lucastimmons.com/weather_demo.png)


## Authors

- [@lucastimmons](https://www.github.com/lucastimmons)

