const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/FBAuth");
const { db } = require("./util/admin");
const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");

//screams route
app.get("/screams", getAllScreams); //get all screams
app.post("/scream", FBAuth, postOneScream); //post one scream
app.get("/scream/:screamId", getScream); //get one scream
app.delete("/scream/:screamId", FBAuth, deleteScream); //delete a scream
app.post("/scram/:screamId/comment", FBAuth, commentOnScream); //comment on a scream
app.get("/scream/:screamId/like", FBAuth, likeScream); //like a scream
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream); //unlike a scream

//users routes
app.post("/signup", signup); //sign up
app.post("/login", login); //login
app.post("/user/image", FBAuth, uploadImage); //upload images
app.post("/user", FBAuth, addUserDetails); //add details to user profile
app.get("/user", FBAuth, getAuthenticatedUser); // returns a user
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth ,markNotificationsRead);

exports.api = functions.region("us-east1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("us-east1")
  .firestore.document("/likes/{id}")
  .onCreate((snapshot) => {
    db.doc(`/Screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.deleteNotificationOnUnlike = functions
.region("us-east1")
  .firestore.document("/likes/{id}")
  .onDelete((snapshot) => {
    db.doc(`/notifications/${sanpshot}`)
        .delete()
        .then(() => {
            return;
        })
        .catch((err) => {
            console.error(err);
            return;
        })
  });

exports.createNotificationOnComment = functions
  .region("us-east1")
  .firestore.document("/comments/{id}")
  .onCreate((snapshot) => {
    db.doc(`/Screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
