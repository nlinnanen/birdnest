# The backend for the birdnest application
This is a backend for the birdnest application. It handles all the data fetching and processing and utilizes socket.io to send the data to the frontend.

## Data storage
The data is currently stored in a map called pilots, which keeps track of the pilots that have violated the NDZ in the last 10 minutes. The key in the map is the drone serial number and the value is an object containing the info about the pilot and the minimum distance to the nest. This would not work if pilots flew multiple drones, but it was stated in the task that cannot be. 

There is another important variable, called timeout which is a map with the keys being a drones serial number and the value an timeout id. Every time we parse data and come across a drone in the NDZ, we clear the timeout that is currently stored in the map and update it with a new timeout, which clears all data regarding that pilot from the pilots map. This ensures that we don't store sensitive information on the pilots longer than we need to.

## Data fetching
The server fetches the xml every 10 seconds. It then parses this and if there is a pilot in the NDZ that is not already in the pilot map, we fetch with from the /pilots endpoint.

## Commands
Start the backend in development mode with ```npm run dev```. This hosts the project at port 3001

Build the project with the backend with ```npm start```