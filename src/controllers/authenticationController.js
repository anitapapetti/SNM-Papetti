// const express = require("express");
require("dotenv").config();
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const User = require("../models/User.js");
const db_uri = process.env.MONGO_URI;
const spotify = require("./spotifyController.js");


// Create JWT token
// Sign with default (HMAC SHA256)
function create_token(user_id){
  const time = Date.now();  // to make user's token different for every session
  const token = jwt.sign({ id: user_id, time: time }, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '6h'
    });
  return token;
}


// Encrypt password
exports.encrypt = function(plain_password){
  return CryptoJS.SHA256(plain_password).toString(CryptoJS.enc.Base64);
};


// Authenticate user and log in
exports.login = async (req, res) => {
	const { email, password } = req.body;
  // email format and password already validated in login.js (before POST request)
    
  try {
    // connect to database
    console.log("Connecting to database...");
    await mongoose.connect(db_uri);
    mongoose.connection.on("error", (error) => {
      res.status(500).json({ message: "Error with db connection." });
      return
    });
    mongoose.connection.once("connected", () => {
      console.log("Successfully connected to database");
    });

    // look up user in db
    const user = await User.findOne({ email: email })
    console.log("Found user ", user.id);   // da togliere

    if(user == null){
      res.status(401).json({ message: "Could not find user's account. Please check if email address is correct.", invalid_field: "email" });
      return;
    }

    // check password
    const encrypted_password = this.encrypt(password);
    if(encrypted_password != user.password){
      res.status(401).json({ message: "Wrong password. Please retry.", invalid_field: "pswd"});
      return;
    }

    // credentials ok
    // create token for app authentication
    const token = create_token(user.id);

    res.cookie("access_token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 6, // 6h
      });
    
    // get Spotify token
    const spotify_token = await spotify.get_spotify_token();

    res.cookie("spotify_token", spotify_token, {
      httpOnly: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 1, // 1h
    });

    console.log("Login successful.");
    return res.status(200).json({ message: 'Login successful.', id: user.id, username: user.username });
      
  } catch (err) {
    if (typeof res.status == 'undefined'){
      res.status(500).json({ message: err.message });
    }
  // } finally {
  //   mongoose.connection.close();
  //   console.log("Closed db connection");
  }
};


// Log out
exports.logout = async (req, res) => {
  await mongoose.connection.close();
  console.log("Db connection closed.");
  
  return res.status(200).clearCookie("access_token").clearCookie("spotify_token").json({ message: "Successfully logged out." });
};


// Insert new user into db and give them a token
exports.signup = async (req, res) => {
  const { username, email, password} = req.body;

  try{
    // connect to database
    console.log("Connecting to database...");
    mongoose.connection.on("error", (error) => {
      res.status(500).json({ message: "Error with db connection." });
      return
    });
    mongoose.connection.once("connected", () => {
      console.log("Successfully connected to database");
    });
    await mongoose.connect(db_uri);

    // check if user email is already used for an existing account
    console.log("Checking if email is already registered...");
    await User.findOne({ email: email })
      .then((user) => {
        if(user !== null){
          console.log("Found already existing user: ", user.id);
          res.status(409).json({ message: "Could not sign up. This email address is already registered.", invalid_fields: ["email"] });
          return;
        }
      });

    // check if user username is already used for an existing account
    console.log("Checking if username is already registered...");
    await User.findOne({ username: username })
      .then((user) => {
        if(user !== null){
          console.log("Found already existing user: ", user.id);
          res.status(409).json({ message: "Could not sign up. This username is already registered.", invalid_fields: ["username"] });
          return;
        }
      });

    // username and email are not already registered in db
    // email format and password already validated in signup.js (before POST request)
    // create new user document with db User schema
    const encrypted = this.encrypt(password);
    console.log("Saving new user in db...");
    const user = await User.create({
      username: username,
      email: email,
      password: encrypted,
      genres: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      favouriteArtists: []
    })

    // create token
    const token = create_token(user.id);

    res.cookie("access_token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 6, // 6h
      });
    
    // get Spotify token
    const spotify_token = await spotify.get_spotify_token();

    const ok_message = "New account created for user " + username;
    return res.status(201).json({ message: ok_message,  id: user.id, username: user.username, spotify_token: spotify_token });

  } catch(err){
    if (typeof res.status == 'undefined'){
      return res.status(500).json({ message: err.message });
    }
  // } finally {
  //   mongoose.connection.close();
  //   console.log("Closed db connection");
  }  
};