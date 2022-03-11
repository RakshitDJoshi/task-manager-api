const app = require('./app')

// Trying to take port value from the environment variable (will have a valid value when heroku tries to access it).
// If the dev script is run, environment variables will be taken from the dev.env file. (see the dev script in index.js)
const port = process.env.PORT

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})