let db = {
    users:[
        {
            userId: '',
            email: '',
            handle: '',
            createdAt: '',
            imageUrl: '',
            bio: '',
            website: '',
            location: '',
        }
    ],
    screams:[
        {
            body: "New Scream",
            userHandle: "new",
            createdAt: '',
            likeCount: 5,
            commentCount: 2
        }
    ]
}

const userDetails = {
    //redux data
    credentials: {
        userId: '',
            email: '',
            handle: '',
            createdAt: '',
            imageUrl: '',
            bio: '',
            website: '',
            location: '', 
    },
    likes: [
        {
            userHandle: "user",
            screamId: "dafljdsklfjdkslfj"
        },
        {
            userHandle: "user",
            screamId: "kdslfjkdlsjfkd"
        }
    ]
}