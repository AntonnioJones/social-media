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
  markNotificationsRead,
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
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("us-east1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("us-east1")
  .firestore.document("/likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/Screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("us-east1")
  .firestore.document("/likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${sanpshot}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("us-east1")
  .firestore.document("/comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/Screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("us-east1")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });

          return batch.commit();
        });
    }else{
      return true
    }
  });

exports.onScreamDelete = functions
.region("us-east1")
.firestore.document("/screams/{screamId}")
.onDelete((snapshot, context) => {
  const screamId = context.params.screamId;
  const batch = db.batch();
  return db.collection('comments').where('screamId', '==', screamId).get()
    .then((data) => {
      data.forEach(doc => {
        batch.delete(db.doc(`/comments/${doc.id}`));
      })
      return db.collection('likes').where('screamId', '==', screamId).get();
    })
    .then((data) => {
      data.forEach(doc => {
        batch.delete(db.doc(`/likes/${doc.id}`));
      })
      return db.collection('notifications').where('screamId', '==', screamId).get();
    })
    .then((data) => {
      data.forEach(doc => {
        batch.delete(db.doc(`/notifications/${doc.id}`));
      })
      return batch.commit();
    })
    .catch((err) =>{
      console.error(err);
    })
})