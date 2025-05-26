import express from 'express';
import router from './lib/router.js';
import passport from 'passport';
import {Strategy as LocalStrategy} from "passport-local";
import cookieSession from 'cookie-session';
import Keygrip from 'keygrip';
import DB from './lib/db.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import 'dotenv/config'

// Configure the express server
const app = express();
const port = process.env.PORT || 3000;
const dbinterface = new DB();

let _ = {};

// Starts the http server listening on port 3000

_.start = () => {

    try {
        app.listen(port);
        console.log('BBS Server listening on port ', port);

    } catch(e) {
        throw new Error(e);
    }

    try {
        const apiKey = process.env.API_KEY;
        //const apiKey = process.env.DB_CONNECT_KEY; //Secrets from github
        console.log("Your API Key is:", apiKey);
        //mongoose.connect('mongodb://localhost:27017/testdb');
        //mongoose.connect('mongodb+srv://petertyrach:<u5mwg5Pk3Q4pKch>@cluster0.mehevcm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/testdb');
        const dbconnectstring= 'mongodb+srv://' + apiKey + '@cluster0.mehevcm.mongodb.net/testdb';
        //mongoose.connect('mongodb+srv://petertyrach:u5mwg5Pk3Q4pKchy@cluster0.mehevcm.mongodb.net/testdb');
        mongoose.connect(dbconnectstring);
        const db = mongoose.connection;

        db.on('error', err => {
            console.log(err);
        });

        db.once('open', () => {
            console.log('Database connection established');
        })

    } catch(e) {
        throw new Error(e);
    }

}

// create cookie
app.use(cookieSession({
    name: 'bbs-cookie',
    keys: new Keygrip(['key1', 'key2'], 'SHA384', 'base64'),
    maxAge: 60 * 60 * 24
}));

// enable app using json input
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user,done) => {
    console.log('4- Serialize User', JSON.stringify(user.id));
    return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log('Deserialize User: ', id);
    
    const user = await dbinterface.findOne(id);
    console.log("passport.deserialize: ", user.id);
    if (user) {
        return done(null, {id: user.id, email: user.email});
    } else {
        return done(new Error('No user with id is found'))
    }

});

passport.use('local', new LocalStrategy({passReqToCallback: true},
    async (req, username, password, done) => {
        console.log('2- local strategy verifying cb',JSON.stringify(username) );
        // This is where we call db to verify user

        //let user = DB.findbyEmail(username);
        //let dbinterface = new DB();
        let user = await dbinterface.findbyUsername(username);

        if (!user) {
            return done(null, false);
        }

        console.log('passport.use user from db: ',JSON.stringify(user) );
        //compare incoming password to stored password using bcypt
        const result = await new Promise((resolve, reject) => {

            bcrypt.compare(password,user.password, (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        }); 

        if (result) {
            return done(null, user);
        } else {
            return done('Passwort oder Benutzername ist nicht korrekt. Bitter erneut versuchen', null);
        }
    }
));

// Default api route
app.use('/api',  router);

_.start();