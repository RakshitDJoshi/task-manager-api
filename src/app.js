const express = require('express')
require('./db/mongoose')
const UserRouter = require('./routers/UserRouter')
const TaskRouter = require('./routers/TaskRouter')

const app = express()

app.use(express.json())
app.use(UserRouter)
app.use(TaskRouter)

module.exports = app