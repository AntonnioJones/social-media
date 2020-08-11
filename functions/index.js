const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/FBAuth");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handlers/users");

//screams route
app.get("/screams", getAllScreams); //get all screams
app.post("/scream", FBAuth, postOneScream); //get one scream
app.post("/user/image", FBAuth , uploadImage); //upload images 
app.get('/user',FBAuth, getAuthenticatedUser)

//users routes
app.post("/signup", signup);//sign up
app.post("/login", login);//login
app.post('/user', FBAuth, addUserDetails)//add details to user profile


exports.api = functions.region("us-east1").https.onRequest(app);
