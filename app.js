require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const md5 = require("md5");
// const encrypt = require("mongoose-encryption");
const saltRounds = 10;
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

// console.log(process.env.SECRET);

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            username: req.body.username,
            password: hash
        });
        newUser.save().then(() => {
            res.render("secrets");
        }).catch((err) => {
            console.log(err);
        });
    });

});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ username: username }).then((foundUser) => {
        if (foundUser) {
                bcrypt.compare(password, foundUser.password).then( (result)=> {
                    if (result == true) {
                        res.render("secrets");
                    }
                });
        }
    }).catch((err) => {
        console.log(err);
    })
});


app.listen(3000, () => {
    console.log("Server started at port 3000..");
})