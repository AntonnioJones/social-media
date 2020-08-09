const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const app = require('express')();
const firebase = require('firebase');

const config = {
  apiKey: "AIzaSyCt2ELKmfn1dmh0hGdF1takGnOg2Vnr6v4",
  authDomain: "social-media-a1b23.firebaseapp.com",
  databaseURL: "https://social-media-a1b23.firebaseio.com",
  projectId: "social-media-a1b23",
  storageBucket: "social-media-a1b23.appspot.com",
  messagingSenderId: "737524978788",
  appId: "1:737524978788:web:6b239ec2edd91eb810bb71",
  measurementId: "G-MXE5QLHMH1"
};

admin.initializeApp();
firebase.initializeApp(config);

const db = admin.firestore();

//check for empty string
const isEmpty = (string) =>{
  if(string.trim() === ''){
    return true;
  }else{
    return false;
  }
}

//checks valiate email
const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(emailRegEx)){
    return true;
  }else{
    return false;
  }
}

//get all the screams
app.get("/screams", (req, res) => {
  db
    .collection("Screams")
    .orderBy('createdAt','desc')
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
});

const FBAuth = (req, res, next) =>{
  let idToken;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
    idToken = req.headers.authorization.split('Bearer ')[1];
  }else{
    console.error('No token found');
    return res.status(403).json({error: 'Unauthorized'});
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data =>{
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(err =>{
      console.error('Error while verifying token', err);
      return res.status(403).json(err);
    })
}

//post a new scream
app.post("/scream", FBAuth, (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };

  db
    .collection("Screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

//signup route
app.post("/signup", (req,res) => {
  const newUser ={
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }

  let errors = {};

  //validate email
  if(isEmpty(newUser.email)){
    errors.email = 'Email must not be empty';
  }else if(!isEmail(newUser.email)){
    errors.email = 'Must be a valid email address';
  }

  //validate password
  if(isEmpty(newUser.password)){
    errors.password = 'password must not be empty'
  }

  //validate confirm password
  if(newUser.password !== newUser.confirmPassword){
    errors.confirmPassword = "passwords must match"
  }

  //validate handle
  if(isEmpty(newUser.handle)){
    errors.handle = "handle must not be empty"
  }

  //return if any validation errors
  if(Object.keys(errors).length > 0){
    return res.status(400).json(errors);
  }

  let token;
  let userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if(doc.exists){
        return res.status(400).json({handle: 'this handle is taken'});
      }else{
        return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) =>{
      token = idToken;
      const userCredentials ={
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
      }

      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({token});
    })
    .catch((err) => {
      console.error(err);
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({email: 'Email is already in use'})
      }else{
        return res.status(500).json({error: err.code});
      } 
    })
});

//login
app.post('/login' , (req,res) =>{
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  //validation
  let errors = {};
  if(isEmpty(user.email)){
    errors.email = "Email Must not be empty";
  }
  if(isEmpty(user.password)){
    errors.password = "password must not be empty";
  }

  if(Object.keys(errors).length > 0){
    return res.status(400).json(errors);
  }

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then((data) =>{
      return data.user.getIdToken();
    })
    .then((token) =>{
      return res.json({token})
    })
    .catch((err) =>{
      if(err.code === 'auth/wrong-password'){
       return res.status(403).json({general:'Wrong credentials, plesase try again'}) 
      }else{
        return res.status(500).json({error: err.code})
      }
   
    })
})

exports.api = functions.region('us-east1').https.onRequest(app);
