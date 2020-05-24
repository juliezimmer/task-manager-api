const mongoose = require('mongoose');

  // Use mongoose to connect to the database
mongoose.connect(process.env.MONGODB_URL, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useFindAndModify: true,
   useUnifiedTopology: true
});



