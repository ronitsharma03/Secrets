require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "This is a bunch of Grapes.",
    resave: false,
    saveUninitialized: false

}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-ronit:test123@cluster0.9patj21.mongodb.net/sanctumDB?retryWrites=true&w=majority");

let localUser = "";
let googleUser = "";
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: Array
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        // userName = user.username;
        return cb(null, {
            id: user.id,
            userName: user.username
        });
    });
    localUser = user.username;
});


passport.deserializeUser(function (user, cb) {
    userName = user.username;
    process.nextTick(function () {
        return cb(null, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://secrets-sanctum-app.onrender.com/auth/google/secrets"
},
    (accessToken, refreshToken, profile, cb) => {
        googleUser = profile._json.name;
        // profilePic = profile.photos[0].value;
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user)
        });
    }
));

app.get("/", (req, res) => {
    res.render("login");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");

    });

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {

    User.find({ "secret": { $ne: null } }).then((foundUsers) => {
        res.render("secrets", { usersWithSecrets: foundUsers, localUser: localUser, googleUser: googleUser });
    }).catch((err) => {
        console.log(err);
    });
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit", {localUser: localUser, googleUser: googleUser });
    } else {
        res.redirect("/");
    }
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect("/");
    });
});

app.get("/failure", (req, res)=>{
    res.render("failure")
});

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/login");
            })
        }
    })

});


// app.post("/login", (req, res) => {
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password
//     });
    // req.login(user, (err) => {
    //     if (err) {
    //         console.log(err)
    //     }
    //     else {
    //         passport.authenticate("local")(req, res, () => {
    //             res.redirect("/secrets");
    //         })
    //     }
    // })
// });

app.post('/login', passport.authenticate('local', {
      successRedirect: '/submit', // Redirect to success page
      failureRedirect: '/failure' // Redirect to failure page
    })
  );

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    const userId = req.user.id;

    User.findById(userId).then((foundUser) => {
        foundUser.secret.push(submittedSecret);
        // console.log(foundUser.secret);
        foundUser.save().then(() => {
            res.redirect("/secrets");
        }).catch((err) => {
            console.log(err);
        });
    });


});


const port = 3000 || process.env.port;
app.listen(port, () => {
    console.log(`Server started at port ${port}..`);
})