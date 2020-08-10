const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/FBAuth");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login, uploadImage } = require("./handlers/users");

//screams route
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);

//users routes
app.post("/signup", signup);
app.post("/login", login);

//upload images 
app.post("/user/image", FBAuth , uploadImage);

exports.api = functions.region("us-east1").https.onRequest(app);
