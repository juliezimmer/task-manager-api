const express = require('express');
require('./db/mongoose');

// importing the user router from routers/user.js 
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

// creates new express application
const app = express();

// define port to deploy to Heroku - requires the use of the environment variable
const port = process.env.PORT;

// automatically parses incoming json to JavaScrip t object format
app.use(express.json());

// Register userRouter
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
   console.log(`Server is up on port ${port}`);
});


