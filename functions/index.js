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

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
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

//signup
app.post("/signup", (req,res) => {
  const newUser ={
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
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
    .then((data) => {
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

exports.api = functions.region('us-east1').https.onRequest(app);
