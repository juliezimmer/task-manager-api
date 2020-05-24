const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true
   },
   email: {
      type: String,
      unique: true, 
      required: true,
      trim: true,
      lowercase: true,
      validate(value){
         if (!validator.isEmail(value)) {
            throw new Error('Email is invalid')
         }
      }
   },
   password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
         if(value.toLowerCase().includes('password')) {
            throw new Error('Password cannot contain "password"')
         }
      }
   },
   age: {
      type: Number,
      default: 0,
      validate(value) {
         if (value < 0 ) {
            throw new Error('Age must be a positive number')
         }
      }
   },
   tokens: [{
      token: {
         type: String,
         required: true
      }
   }], 
   avatar: {
      type: Buffer
   }
}, {
   timestamps: true
});

userSchema.virtual('tasks', {
   ref: 'Task',
   localField:'_id',
   foreignField:'owner'

});

userSchema.methods.toJSON = function() {
   const user = this;
   // want an object back with just user data
   const userObject = user.toObject();
   
   delete userObject.password;
   delete userObject.tokens;
   delete userObject.avatar;
   
   return userObject;

}

// new method to generate a token for a single specific user
// methods are accessible on the instances of the model (small u)
userSchema.methods.generateAuthToken = async function () {
   const user = this; // provides us access to this particular specific user
   // generates a jwt using jwt.sign() - ned to provide payload and secret
   // toString is used to convert the user.id to a string because it is an object id
   const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);
  
   user.tokens = user.tokens.concat({ token }); // this is the token property defined above in the model
   await user.save(); // saves token to the DB
   return token;
}

// provides direct access to the model by other code
// static methods are accessible on the model
userSchema.statics.findByCredentials = async (email, password) => {
   // to find user by email
   const user = await User.findOne({ email })
   // no user with that email was found
   if(!user) {
      throw new Error('Unable to login');
   }
   // user is found and password/hashed pw are compared
   // user.pawssword is the hashed password
   const isMatch = await bcrypt.compare(password, user.password)
   // if the passwords don't match   
   if(!isMatch) {
      throw new Error('Unable to login');
   }
   // password matches
   return user;
}

// middleware for hashing the plain text password before saving
userSchema.pre('save', async function (next) {
   const user = this; // gives access to the individual user who is about to be saved.
   
   // hash the password
   if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8);
   }
   next();
});

// Delete user task when user is removed
userSchema.pre('remove', async function(next) {
   const user = this;
   await Task.deleteMany({ owner: user._id });
   
   next();
})


const User = mongoose.model('User', userSchema);
module.exports = User;

