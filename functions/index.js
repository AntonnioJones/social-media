const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/FBAuth");
const { 
    getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream} = require("./handlers/screams");
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser } = require("./handlers/users");

//screams route
app.get("/screams", getAllScreams); //get all screams
app.post("/scream", FBAuth, postOneScream); //post one scream
app.get('/scream/:screamId', getScream);  //get one scream
app.post('/scram/:screamId/comment',FBAuth, commentOnScream);

//users routes
app.post("/signup", signup);//sign up
app.post("/login", login);//login
app.post("/user/image", FBAuth , uploadImage); //upload images 
app.post('/user', FBAuth, addUserDetails)//add details to user profile
app.get('/user',FBAuth, getAuthenticatedUser)


exports.api = functions.region("us-east1").https.onRequest(app);
