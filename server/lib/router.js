import express from 'express';
import User from '../models/user.js';
import Event from '../models/event.js';
import passport from 'passport';
import DB from '../lib/db.js';
import Holidays from 'date-holidays';
import jsonclosedDays from '../bbs_closed_days.json' with { type: 'json' };


import  {body, validationResult, checkSchema, matchedData } from 'express-validator';
import {UserValidationSchema} from '../utils/validationSchemas.js';



let _ = express.Router();
let groupmap = new Map();

const reqireAuth = (req, res, next) => {
    console.log('\n router.requireAuth reqire auth middleware ...');
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).json({
            timestamp: Date.now(),
            msg: 'Access denied',
            code: 403
        });
    }
}


// POST /register

_.post('/register', checkSchema(UserValidationSchema), async (req,res) => {
    
    try {
        const result = validationResult(req);
        console.log('req:', req);
        if (result.isEmpty()){
            const data = matchedData(req);
            //console.log('data:', data);

            let user = new User();
            user.setUserName(data.username);
            user.setContactPerson(data.contactperson);
            user.setPhoneNo(data.phone);
            user.setEMail(data.email);
            if (data.username != 'Admin') {
                user.setUserRole('Bowler');
            } else {
                user.setUserRole('Admin');
            }
            
            let passwdresult = await user.setPassword(data.password);
            //console.log('passwdresult:',passwdresult);

            if (!passwdresult) {
                res.status(400).json({
                    error: 'Passwort nicht gespeichert',
                    msg: 'Sonderzeichen mehrfach verwendet',
                    code: 400
                });
                //return res.status(400).send('Sonderzeichen mehrfach verwendet')
            } else {
                // save the user to the database
                user.save();
                console.log('parseUser');
                let record = await user.parseUser();

                res.status(200).json({
                    timestamp: Date.now(),
                    msg: 'Successfully registered',
                    record,
                    code: 200
                });

            }
            
        } else {

            return res.status(400).send({errors: result.array()});
        }
    } catch(e) {
        throw new Error(e);
    }
    
});

// POST /login

_.post('/login',
    (req, res, next) => {
        try {
            console.log('1- Login handler:', JSON.stringify(req.body) );
            passport.authenticate(
                'local',
                (err, user) => {
                    console.log('3- passport authenticate cb', JSON.stringify(user));

                    if (err) {
                        return res.status(401).json({
                            timestamp: Date.now(),
                            msg: 'Zugriff verweigert. Benutzername oder Passwort ist inkorrekt',
                            code: 401
                        });
                    }
                    if (!user) {
                        return res.status(401).json({
                            timestamp: Date.now(),
                            msg: 'Unberechtigter Benutzer',
                            code: 401
                        });
                    }

                    req.logIn(user, (err) => {
                        if (err) {
                            return next(err);
                        }
                        res.status(200).json({
                        redirectTo: '/bbs_latest'
                        })
                    });
                
                })(req, res, next)
        } catch(e) {
            throw new Error(e);
        } 
    }
)

// POST /logout

_.post('/logout', async (req,res) => {
    console.log("logout called");

    try {
        //res.redirect(200, '/');
        req.session=null;
        
        res.status(200).json({
            timestamp: Date.now(),
            msg: 'Logged out successfully',
            code: 200
        });
        
        

    } catch(e) {
        throw new Error(e);
    }
});

_.get('/user', reqireAuth ,async (req, res) => { 
//_.get('/user', async (req, res) => {

    try {
        console.group('\n GET /user - request details:');
        console.log('-----------------------------------\n');
        console.log('req.isAuthenticated ', req.isAuthenticated());
        console.log('req.user ', req.user);
        console.groupEnd();

        let dbinterface = new DB();
        const user = await dbinterface.findOne(req.user?.id);
        console.log("router get user :", user);

        if (!user) return res.status(404).json({
            timestamp: Date.now(),
            msg: 'User not found',
            code: 404
        });

        res.status(200).json({
            user: {
                id: req.user.id,
                email: user.email,
                name: user.username
            }
        });

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get user, internal server error',
            code: 500
        });
    }
});

// POST /saveEvent

_.post('/saveEvent',  async (req,res) => {
    
    try {
        console.log("body: ", req.body);
        

            let event = new Event();
            event.setTitle(req.body.title);
            event.setStartPoint(req.body.start);
            event.setEndPoint(req.body.end);
            event.setUserID(req.body.userid);
            event.setGroupID(req.body.groupId);

            if (req.body.groupId != null) {
                event.setSeries(req.body.freq, req.body.interval, req.body.byweekday, req.body.dtstart, req.body.until);
                event.setDuration(req.body.duration);
                event.setExdate(req.body.exdate);
            }

            // save the event to the database
            const eventid = await event.save();
            event.setDBEventID(eventid);

            res.status(200).json({
                timestamp: Date.now(),
                msg: 'Event successfully saved',
                event,
                code: 200
            });

        
    } catch(e) {
        throw new Error(e);
    }    
});

_.post('/updateEvent',  async (req,res) => {
    
    try {
        console.log("body: ", req.body);
        

            // save the event to the database
            const eventid = req.body.eventid; 
            const eventtitle = req.body.title;
            const eventstart = req.body.start;
            const eventend = req.body.end;

            const result= await DB.updateEvent(eventid, eventtitle, req.body.start, req.body.end, req.body.freq, req.body.interval, req.body.weekday, req.body.duration, req.body.exdate);
            if (result) { 
                res.status(200).json({
                timestamp: Date.now(),
                msg: 'Event successfully updated',
                eventid,
                code: 200
                });
            } else {
                res.status(404).json({
                    timestamp: Date.now(),
                    msg: 'Event not updated',
                    eventid,
                    eventtitle,
                    code: 404
                });
            }
        
    } catch(e) {
        throw new Error(e);
    }
});

_.post('/deleteEvent',  async (req,res) => {
    
    try {
        console.log("body: ", req.body);
        

            // save the event to the database
            const eventid = req.body.eventid; 
            const result= await DB.deleteEvent(eventid);
            if (result) { 
                res.status(200).json({
                timestamp: Date.now(),
                msg: 'Event successfully removed',
                eventid,
                code: 200
                });
            } else {
                res.status(404).json({
                    timestamp: Date.now(),
                    msg: 'Event not removed',
                    eventid,
                    code: 404
                });
            }
        
    } catch(e) {
        throw new Error(e);
    }    
});

_.get('/getEvents' ,async (req, res) => {

    try {
        let dbinterface = new DB();
        const events = await dbinterface.getEvents();

        for (let i = 0; i < events.length; i++) {
            console.log("router get events :", events[i].title);
        }

        res.status(200).json({events});

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get events, internal server error',
            code: 500
        });
    }
});

_.post('/getgroupID' ,async (req, res) => {

    let id;
    try {
        const username = req.body.username; 
        if (groupmap.has(username)== false) {
            groupmap.set(username, 1);
        }
        else {
            groupmap.set(username, groupmap.get(username) + 1);
        }
    
        id = username + "_" + groupmap.get(username);
        console.log("getgroupID: ", id);

        res.status(200).json(id);

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get groupid, internal server error',
            code: 500
        });
    }
});

_.post('/getHolidays' ,async (req, res) => {

    let publicholidays=[];
    let holidaysinBavaria=[];

    try {
        let holidays = new Holidays('DE', 'BY');

        for (let i =req.body.startyear;i < req.body.endyear; i++) {
            let hd = holidays.getHolidays(i);
            holidaysinBavaria.push(hd);
        }

        for (let i =0;i < holidaysinBavaria.length; i++) {
            for (let j =0;j < holidaysinBavaria[i].length; j++) {
                if (holidaysinBavaria[i][j].type === 'public') {
                    let event = new Event();
                    let pdate = holidaysinBavaria[i][j].date.split(" ");
                    event.setTitle(holidaysinBavaria[i][j].name);
                    event.setStartPoint(pdate[0]);
                    event.setEndPoint(pdate[0]);
                    publicholidays.push(event);
                }
            }
        }

        console.log("Closed Days:", jsonclosedDays);

        for (let i =0;i < jsonclosedDays.length; i++) {
            let event = new Event();
            
            event.setTitle(jsonclosedDays[i].title);
            event.setStartPoint(jsonclosedDays[i].start);
            event.setEndPoint(jsonclosedDays[i].end);
            
            publicholidays.push(event);    
        }

        res.status(200).json({publicholidays});

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get holidays, internal server error',
            code: 500
        });
    }
});

// POST all

_.all(/(.*)/, async(req,res) => {
    try {
        res.status(404).json({
            timestamp: Date.now(),
            msg: 'no route matches your request',
            code: 404
        });

    } catch(e) {
        throw new Error(e);
    }

}); 

export default _;