const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');

// Schema for the user
const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

// To be defined on a new connection (see initialize)
let User;

function initialize() {
  return new Promise(function (resolve, reject) {
    const dbURI = process.env.MONGODB; // Load the connection string from the environment variable

    if (!dbURI) {
      return reject('MongoDB URI is not defined in the environment variables');
    }

    let db = mongoose.createConnection(dbURI);
    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    // Validate the password
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Hash the password
    bcrypt.hash(userData.password, 10)
      .then(hash => {
        // Create a new user object with the hashed password
        let newUser = new User({
          userName: userData.userName,
          password: hash,
          email: userData.email,
          loginHistory: []
        });

        // Save the new user to the database
        newUser.save()
          .then(() => {
            resolve(); // Successfully saved the user
          })
          .catch(err => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch(err => {
        reject("There was an error encrypting the password");
      });
  });
}


// Function to check user credentials
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName }).then(users => {
      if (users.length === 0) {
        reject(`Unable to find user: ${userData.userName}`);
        return;
      }

      const user = users[0];

      // Compare the provided password with the hashed password in the database
      bcrypt.compare(userData.password, user.password)
        .then(result => {
          if (!result) {
            reject(`Incorrect password for user: ${userData.userName}`);
            return;
          }

          // Update login history
          if (user.loginHistory.length >= 8) {
            user.loginHistory.pop(); // Remove the oldest login history entry
          }

          user.loginHistory.unshift({
            dateTime: new Date(),
            userAgent: userData.userAgent
          });

          user.updateOne({ $set: { loginHistory: user.loginHistory } })
            .then(() => {
              resolve(user); // Resolve with the authenticated user
            })
            .catch(err => {
              reject(`There was an error verifying the user: ${err}`);
            });
        })
        .catch(err => {
          reject("There was an error comparing passwords");
        });
    }).catch(err => {
      reject(`Unable to find user: ${err}`);
    });
  });
}

module.exports = {
  initialize,
  registerUser,
  checkUser
};
