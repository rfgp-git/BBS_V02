import express from 'express';
import User from '../models/user.js';
import Event from '../models/event.js';
import Invoice from '../models/invoice.js';

import passport from 'passport';
import DB from '../lib/db.js';
import Holidays from 'date-holidays';
import jsonclosedDays from '../bbs_closed_days.json' with { type: 'json' };


import  {body, validationResult, checkSchema, matchedData } from 'express-validator';
import {UserValidationSchema} from '../utils/validationSchemas.js';

import pdfpckg from '@pdftron/pdfnet-node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodemailer from 'nodemailer';
import 'dotenv/config';


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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// PDF replacer
const { PDFNet } = pdfpckg;

const mailprovider = process.env.APP_MAIL_PROVIDER;

// e-mail settings

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: mailprovider,
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.APP_MAIL_USER,
    pass: process.env.APP_MAIL_PASSWORD
  },
  //debug: true, // Enable debug output
  //logger: true, // Log information
});

if (transporter.options.auth.user == undefined) {
    console.log('Environment Error');
}

const sendMail = async (transporter, mailOptions) => {
    try {

        await transporter.sendMail(mailOptions);
        console.log('E-Mail sent successfully to ', mailOptions.to);
        if (mailOptions.attachments != null) {
            console.log('with attachment', mailOptions.attachments);
        }

    } catch(error) {
        console.log('E-Mail sent not from ', mailOptions.from);
        console.log('E-Mail sent not to ', mailOptions.to);
        console.error(error);
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
            if (data.username != 'Administrator') {
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
                const result = await user.save();
                if (result) {
                    let record = await user.parseUser(); // remove user details like password

                    res.status(200).json({
                        timestamp: Date.now(),
                        msg: 'Successfully registered',
                        record,
                        code: 200
                    });
                } else {
                    res.status(211).json({
                        error: 'User alread exists',
                        msg: 'Benutzer ist bereits vorhanden',
                        code: 211
                    });
                }
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
                contact: user.contact,
                email: user.email,
                name: user.username,
                phone: user.phone
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

_.post('/updateUser',  async (req,res) => {
    
    try {
        console.log("body: ", req.body);

        let userID = req.body.UUser.ID;
        let userName = req.body.UUser.name;

        const result= await DB.updateUser(req.body.UUser.ID, req.body.UUser.name, req.body.UUser.contact, req.body.UUser.phone, req.body.UUser.email, req.body.UUser.passwd);
        if (result) { 
            res.status(200).json({
            timestamp: Date.now(),
            msg: 'User successfully updated',
            userID,
            code: 200
            });
        } else {
            res.status(404).json({
                timestamp: Date.now(),
                msg: 'User not updated',
                userID,
                userName,
                code: 404
            });
        }
        
    } catch(e) {
        throw new Error(e);
    }
});

_.post('/getallUsers' ,async (req, res) => {

    try {
        let dbinterface = new DB();
        const users = await dbinterface.getallUsers();

        console.log("getallUsers total :", users.length);

        res.status(200).json({users});

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get all users, internal server error',
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

            let series ="";

            if (req.body.freq == null) {
                series = "einmalig";
            } else {
                series = "wöchentlich";
            }

            sendEMailtoAdmin("New", req.body.title, req.body.start, req.body.end, series, req.body.interval);

    } catch(e) {
        throw new Error(e);
    }    
});

_.post('/updateEvent',  async (req,res) => {
    let series ="";
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

                if (req.body.freq == null) {
                    series = "einmalig";
                } else {
                    series = "wöchentlich";
                }

                if (req.body.exdate.length === 0 ) {
                    // normal Event
                    sendEMailtoAdmin("Updated", eventtitle, eventstart, eventend, series, req.body.interval);
                } else {
                    // series
                    sendEMailtoAdmin("Event removed from series", eventtitle, eventstart, req.body.exdate, series, req.body.interval);
                }

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
            const eventtitle = req.body.title;
            const eventstart = req.body.start;
            const eventend = req.body.end;
            const eventfreq = req.body.freq;
            const eventinterval = req.body.interval;


            const result= await DB.deleteEvent(eventid);
            if (result) { 
                res.status(200).json({
                timestamp: Date.now(),
                msg: 'Event successfully removed',
                eventid,
                code: 200
                });
                sendEMailtoAdmin("Deleted", eventtitle, eventstart, eventend, eventfreq, eventinterval);
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

// POST /saveInvoice

_.post('/saveInvoice',  async (req,res) => {
    
    try {
        console.log("body: ", req.body);
        

            let invoice = new Invoice();
            invoice.setInvoiceContact(req.body.Bill_Contact);
            invoice.setInvoiceNo(req.body.Bill_No);
            invoice.setInvoiceDate(req.body.Bill_Date);
            invoice.setInvoicePayment('open');
            invoice.setInvoiceStatus('open');
            invoice.setInvoiceDrinksTotal(req.body.Bill_DrinkTotal);
            invoice.setInvoiceChargeTotal(req.body.Bill_ChargeTotal);
            invoice.setInvoiceAmount(req.body.Bill_SumTotal);
            invoice.setUserID(req.body.Bill_UserID);

            // save the invoice to the database
            const invoiceid = await invoice.save();
            invoice.setDBInvoiceID(invoiceid);

            res.status(200).json({
                timestamp: Date.now(),
                msg: 'Invoice successfully saved',
                invoice,
                code: 200
            });

        
    } catch(e) {
        throw new Error(e);
    }    
});

_.post('/getmyInvoices' ,async (req, res) => {

    try {
        const userid = req.body.userid;
        let dbinterface = new DB();
        const invoices = await dbinterface.getmyInvoices(userid);

        
        for (let i = 0; i < invoices.length; i++) {
            console.log("router get my invoices :", invoices[i].inv_no);
        }

        res.status(200).json({invoices});

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get invoices, internal server error',
            code: 500
        });
    }
});

_.post('/getallInvoices' ,async (req, res) => {

    try {
        let dbinterface = new DB();
        const invoices = await dbinterface.getallInvoices();

        console.log("getalInvoices total :", invoices.length);

        res.status(200).json({invoices});

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get all invoices, internal server error',
            code: 500
        });
    }
});


_.post('/getlastInvoiceNo' ,async (req, res) => {
    let invoiceno = 0;
    try {
        const userid = req.body.userid;
        let dbinterface = new DB();
        const result = await dbinterface.getlastInvoiceNo(userid);

        if (result == false ) {
            invoiceno = 0;
        } else {
            invoiceno = result;
        }

        console.log("router getlastInvoiceNo :", invoiceno);

        res.status(200).json(invoiceno);

    } catch (err) {
        console.error(new Error(err.message));
        res.status(500).json({
            timestamp: Date.now(),
            msg: 'Failed to get invoice number, internal server error',
            code: 500
        });
    }
});

_.post('/generateInvoice' ,async (req, res) => {
    
    console.log("body: ", req.body);
    const invoiceparam = req.body;

    const inputPath = path.resolve(__dirname, '../files/' + 'BBS_Invoice_Template_' + invoiceparam.Bill_Payment + '.pdf');
    const pdftarget = 'BBS_Rechnung_' + invoiceparam.Bill_No + '.pdf';
    const outputPath = path.resolve(__dirname, '../files/' + pdftarget);

    console.log('input:', inputPath );
    console.log('output:', outputPath );

    const replaceText = async () => {
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        await pdfdoc.initSecurityHandler();
        const replacer = await PDFNet.ContentReplacer.create();
        const page = await pdfdoc.getPage(1);

        await replacer.addString('BBS_User', invoiceparam.Bill_Recipient);
        await replacer.addString('BBS_Contact', invoiceparam.Bill_Contact);

        await replacer.addString('BBS_BillNo', invoiceparam.Bill_No);
        //await replacer.addString('BBS_BillDate', new Date(Date.now()).toLocaleDateString());
        await replacer.addString('BBS_BillDate', invoiceparam.Bill_Date);

        await replacer.addString('BBS_DrinkTotal', invoiceparam.Bill_DrinkTotal + " €");
        await replacer.addString('BBS_CharTotal', invoiceparam.Bill_ChargeTotal + " €");
        await replacer.addString('BBS_SumTotal', invoiceparam.Bill_SumTotal + " €");

        await replacer.process(page);

        pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);

        // mail options settings

        const mailOptions = {
            from: {
                name: 'KV-Sankt-Kunigund',
                address: process.env.APP_MAIL_USER
            },
            //to: 'peter.tyrach@googlemail.com',
            to: invoiceparam.Bill_Mail,
            subject: 'BBS Rechnung',
            text: 'Kegelbahn Schnaittach',
            html: "Rechnung für die Kegelbahn in Schnaittach",
            attachments: [{
                filename: pdftarget,
                //path: path.join (__dirname, '../files/BBS_Rechnung_Alle Neune_2025_001.pdf'),
                path: outputPath,
                contentType: 'application/pdf'
            }]
        }
        sendMail(transporter, mailOptions);
    }

    PDFNet.runWithCleanup(replaceText, 'demo:1753519859856:618bec4e03000000009c1b87972621733d8b5282205f959cbc6a274c24').then(() => {
        res.status(200).json({
            timestamp: Date.now(),
            msg: 'pdf file successfully created',
            outputPath,
            code: 200
        });
    }).catch(err => {
        res.status(404).json({
            timestamp: Date.now(),
            msg: 'Error by creating pdf file',
            outputPath,
            code: 404
        });
        throw new Error(err);
    });
});

_.post('/updateInvoice',  async (req,res) => {
    
    try {
            console.log("updateInvoice body: ", req.body);

            // save the invoice payment and status to the database
            const inv_no = req.body.inv_no; 
            const inv_payment = req.body.inv_payment;
            const inv_status = req.body.inv_status;  
            
            const result= await DB.updateInvoice(inv_no, inv_payment, inv_status);
            if (result) { 
                res.status(200).json({
                timestamp: Date.now(),
                msg: 'Invoice successfully updated',
                inv_no,
                code: 200
                });
            } else {
                res.status(404).json({
                    timestamp: Date.now(),
                    msg: 'Invoice not updated',
                    inv_no,
                    code: 404
                });
            }
        
        } catch(e) {
            throw new Error(e);
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

function sendEMailtoAdmin(action, title, start, end, series, interval) {

    let htmlText = "";
    if (action === "Event removed from series") {
        htmlText = "<p><b>Reservierung " + action + "</b><br>" + 
                            "Titel: " + title + "<br>" +
                            "Start: " + start + "<br>" +
                            "Event entfernt: " + end + "<br>" +
                            "Serie: " + series + "(" + interval + ")" + "<br>" +
                            "</p>";
    } else {
        htmlText = "<p><b>Reservierung " + action + "</b><br>" + 
                            "Titel: " + title + "<br>" +
                            "Start: " + start + "<br>" +
                            "Ende: " + end + "<br>" +
                            "Serie: " + series + "(" + interval + ")" + "<br>" +
                            "</p>";
    }

    const subject = "BBS Reservierung " + action;
    
    const mailOptions = {
        from: {
            name: 'KV-Sankt-Kunigund',
            address: process.env.APP_MAIL_USER
        },
        //to: 'peter.tyrach@googlemail.com',
        to: process.env.APP_MAIL_ADMIN,
        subject: subject,
        text: 'Kegelbahn Schnaittach',
        html: htmlText
    }
    
    //sendMail(transporter, mailOptions);

};

