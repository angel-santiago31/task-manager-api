const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

// INITIALIZE EXPRESS AND SET PORT
const app = express()
const port = process.env.PORT 

// MAKE EXPRESS PARSE REQUEST BODY TO JSON
app.use(express.json())

// ROUTERS
app.use(userRouter)
app.use(taskRouter)

// START APPLICATION
app.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})