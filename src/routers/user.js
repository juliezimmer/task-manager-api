const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

// Load the User Model
const User = require('../models/user');

// allows the auth middleware to be assigned to an individual route
const auth = require('../middleware/auth');

// by using object destructuring, we can use the same const name
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

// Create a new Router
const router = new express.Router();

// Route handler for adding a user to the DB 
// sends back a jwt authentication token
router.post('/users', async (req, res) => {
   const user = new User(req.body);
   try {
      await user.save();
      // sends welcome email to newly signed up users
      sendWelcomeEmail(user.email, user.name);
      const token = await user.generateAuthToken();
      res.status(201).send({ user, token });
   } catch(e) {
      res.status(400).send(e);
   }
});

// for logging in with an existing account
// sends back a jwt authentication token
// The job of this route is to find a user with the proper credentials: email/password. 
router.post('/users/login', async (req, res) => {
   try { // User.findByCredentials() will call whatever is defined on User.Schema.statics.findByCredentials in the models/user.js file 
      const user = await User.findByCredentials(req.body.email, req.body.password);
      // this is for a single user instance to generate a token for a specific user
      
      const token = await user.generateAuthToken(); // generates and returns a token to a particular individual user, which can then be sent back to the requestor.
      res.send({ user, token })
      
   } catch(e) {
      res.status(400).send();
   }
});

//Route handler to log out
router.post('/users/logout', auth, async (req, res) => {
   try {
      req.user.tokens = req.user.tokens.filter((token) => {
         return token.token !== req.token;// req.token  is the one that is being used
      })
      await req.user.save();

      res.send();
   } catch(e) {
      res.status(500).send();
   }
});

// Route Handler for getting your own profile
router.get('/users/me', auth, async (req,res) => {
   res.send(req.user);
});

// Route handler for logging out of all sessions at once
router.post('/users/logoutAll', auth, async (req,res) => {
   try {
      // wipe out everything
      req.user.tokens = [];
      await req.user.save();
      res.send();
   } catch (e) {
      res.status(500).send();
   }
});

// Route Handler for deleting a user
router.delete('/users/me', auth, async (req, res) => {
   try {
      await req.user.remove();
      sendCancelationEmail(req.user.email, req.user.name)

      res.send(req.user); // if there was a deleted user, it is sent as the response body.
   } catch(e) {
      res.status(500).send();
   }
});

// Route Handler for updating a user
router.patch('/users/me', auth, async (req,res) => {
   const updates = Object.keys(req.body);
   const allowedUpdates = ['name', 'email', 'password', 'age'];
   const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
   
   if(!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates'}) 
   }

   try {
      updates.forEach((update) => req.user[update] = req.body[update]);
      await req.user.save(); // middleware gets executed.
      res.send(req.user);
   } catch (e) {
      res.status(400).send(e);
   }
});

const upload = multer({
   limits: {
      fileSize: 1000000
   },
   fileFilter(req, file, cb) {
      if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
         return cb (new Error('Please upload an image'));
      }
      cb (undefined, true);
   }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
   const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
   
   // buffer is the modified image
   req.user.avatar = buffer;
   await req.user.save();
   res.send();
}, (error, req, res, next) => {
   res.status(400).send({ error: error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
   req.user.avatar = undefined;
   await req.user.save();
   res.send();
});

// get avatar for user by their id
router.get('/users/:id/avatar', async (req, res) => {
   try {
      const user = await User.findById(req.params.id);
       
      // if there is no user OR there is no avatar image
      if(!user || !user.avatar) {
         throw new Error();
      }
      // set the image type using the response header on the response object
      res.set('Content-Type', 'image/png');
      // send the image back
      res.send(user.avatar);

   }  catch (e) {
         res.status(404).send();
   }

})


// export the new router in index.js
module.exports = router;