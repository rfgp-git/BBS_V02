let User = {};
let calendar;
let aholidays = [];
let aclosed = [];
let startyear;
let endyear;
let processingMode;
let existingEvent = {};
let exEventIndex = -1;
let dbevents = [];
let groupId = null;
let groupNo = null;
let errorText = "";
let closedDays=0;

const MODE = {
    VIEW: 1,
    UPDATE: 2,
    CREATE: 3
}

const wdays = ['So', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
let seriesmap = new Map();
// map with all not blocked events like public holidays or closed days
let eventsmap = new Map();

window.onload = async () => {
    let groupIdParts = null;
    
    seriesmap.set('once',0);
    seriesmap.set('weekly_1',1);
    seriesmap.set('weekly_2',2);
    seriesmap.set('weekly_3',3);
    seriesmap.set('weekly_4',4);

    let menuItem1 = document.getElementById("Menu_Profile1");
    let menuItem2 = document.getElementById("Menu_Profile2");

    if (!sessionStorage.getItem('isAuthenticated')) {
        alert('Zugriff verweigert');
        window.location.href = 'index.html';
    } else {
        // Retrieve the JSON string from local storage
        let retString = localStorage.getItem("ActiveUser");
         if (retString != null) {
            // Convert the JSON string back to an array
            User = JSON.parse(retString);
            console.log("User: ", User.user.name + " " + User.user.id);
            
            // change profile name of menu
            menuItem1.textContent = User.user.name; 
            // change profile name of drawer
            menuItem2.textContent = User.user.name;
         } else {
            menuItem1.textContent = 'Error';
            menuItem2.textContent = 'Error';
         }
        
    }

    processingMode=MODE.VIEW;

    // get public holidays and closed days
    
    const currentYear = new Date().getFullYear();
    const pholidays = await getpublicHolidays(startyear, endyear); 
    
    closedDays = pholidays.publicholidays.length;

    for (let i = 0; i < pholidays.publicholidays.length; i++) {
        pholidays.publicholidays[i].overlap   = false,
        pholidays.publicholidays[i].editable  = false,
        pholidays.publicholidays[i].draggable = false,
        pholidays.publicholidays[i].allow     = false,
        pholidays.publicholidays[i].display   = 'background'
        pholidays.publicholidays[i].color     = '#ff9f89';

        aholidays.push(pholidays.publicholidays[i].start);
        
        calendar.addEvent(pholidays.publicholidays[i]);
    }
        
        
    // get events from the database
    dbevents = await getEventsfromDB();
    let revent={};
    
    for (let i = 0; i < dbevents.events.length; i++) {
        if (User.user.id === dbevents.events[i].userid || User.user.name === 'Administrator' ) {
            dbevents.events[i].eventTextColor = '#000000';
            dbevents.events[i].color='#4CAF50'; // green
            if (dbevents.events[i].groupId != null) {
                groupIdParts = dbevents.events[i].groupId.split("_");
                if (groupIdParts[1] > groupNo) {
                    groupNo = groupIdParts[1]; 
                }
                calendar.addEvent(dbevents.events[i]);
            } else {
                calendar.addEvent({
                    title:  dbevents.events[i].title,
                    start:  dbevents.events[i].start,
                    end:    dbevents.events[i].end,
                    eventTextColor: '#000000',
                    color:  '#4E95D9', // blue
                    extendedProps: {
                        userid: User.user.id,
                        _id: dbevents.events[i]._id
                    },
                });
            }
        } else {
            dbevents.events[i].overlap   = false,
            dbevents.events[i].editable  = false,
            dbevents.events[i].draggable = false,
            dbevents.events[i].allow     = false,
            dbevents.events[i].color     = '#808080'; // grey
            if (dbevents.events[i].groupId != null) {
                calendar.addEvent(dbevents.events[i]);
            } else {
                calendar.addEvent({
                    title:  dbevents.events[i].title,
                    start:  dbevents.events[i].start,
                    end:    dbevents.events[i].end,
                    color:  '#808080',
                    extendedProps: {
                        userid: dbevents.events[i].userid,
                        _id: dbevents.events[i]._id
                    },
                });
            }
        }
        /*
        revent.title=dbevents.events[i].title;
        revent.start=dbevents.events[i].start;
        revent.end=dbevents.events[i].end;
        let rinterval = dbevents.events[i].rrule.interval;
        let runtil = dbevents.events[i].rrule.until;
        */
        filleventsmap(dbevents.events[i]);
        //eventsmap.set("2025-12-01", revent);
    }
    
    // buttons of modal dialog
    const cancel_btn = document.getElementById("cancelButton");
    cancel_btn.addEventListener("click", event => {
        closeModalDialog();     
    });

    const submit_btn = document.getElementById("submitButton");
    submit_btn.addEventListener("click", async event => {
        let result = await submitEvent(event); 
        console.log("Submit:", result);
        closeModalDialog();
        window.location.reload(); 
    });

    const delete_btn = document.getElementById("deleteButton");
    delete_btn.addEventListener("click", event => {
        deleteEvent(event);     
    });

    // find overlappings after events were created
    postCheckOverlapping();

}

document.addEventListener('DOMContentLoaded', async function() {

    let currentyear = new Date().getFullYear();
    startyear = currentyear -1 ;
    endyear= currentyear + 2;

    const calendarEl = document.getElementById('calendar')
    calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay,dayGridMonth,listMonth'
        },
        titleFormat: { // Customizing the title format
            month: 'short', // Full month name
            year: 'numeric', // Full year
            day: 'numeric' // Day of the month
        },
        buttonText: {
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag',
            listMonth: 'Liste',
        },
        validRange: {
            start: startyear + '-01-01', // Start range 2024-0-01
            end: endyear + '-01-01'   // End of the range (exclusive) 2027-01-01
        },
        slotMinTime: '09:00', // Start displaying from 9 AM
        slotMaxTime: '23:00', // End displaying at 5 PM
        longPressDelay:100,
        hiddenDays: [0],
        locale: 'DE',
        timeZone: 'Europe/Berlin',
        initialView: 'timeGridWeek',
        initialDate: new Date(),
        navLinks: true, // can click day/week names to navigate views
        selectable: true,
        eventDurationEditable: false,
        
        //droppable: true,
        //selectMirror: true,
        select: async function(arg) {
            // events can only be added in the weeks and day view
            if (arg.view.type == 'dayGridMonth') {
                calendar.unselect();
                arg.jsEvent.stopPropagation();
                return false;   
            }
            
            let startdaytime = [];
            startdaytime = arg.startStr.split("T");

            // check if day is holiday to disable select
            if (isHoliday(startdaytime[0])) {
                calendar.unselect();
                arg.jsEvent.stopPropagation();
                return false; 
            }

            // check if day is holiday to disable select
            if (isClosed(startdaytime[0])) {
                calendar.unselect();
                arg.jsEvent.stopPropagation();
                return false; 
            }

            if (arg.allDay) {
                calendar.unselect();
                arg.jsEvent.stopPropagation();
                return false; 
            }
        
            // open modal dialog
            processingMode = MODE.CREATE;
            openModalDialog(arg);

        },
        
        eventClick: async function(arg) {
            exEventIndex = -1;
            if (User.user.id === arg.event._def.extendedProps.userid || User.user.name === 'Administrator') {
                // update existing event
                existingEvent = arg;
                if (existingEvent.event._def.groupId != "") {
                    exEventIndex = getEvIndex(existingEvent.event._def.groupId);
                }
                    
                processingMode = MODE.UPDATE;
                openModalDialog(arg);
            }
          },
          
        editable: false,
        dayMaxEvents: true, // allow "more" link when too many events
    });

    calendar.render();

});

function openModalDialog(event) {

    const mDialog = document.getElementById("eventModal");
    let startdaytime = [];
    let enddaytime = [];
    
    
    if (processingMode == MODE.CREATE) {

        document.getElementById("modalTitle").textContent="Reservierung anlegen";
        document.getElementById("submitButton").value="Anlegen";
        document.getElementById("deleteButton").style.display = 'none';
        
        startdaytime = event.startStr.split("T");
        document.getElementById("eventDate").value = startdaytime[0];
        document.getElementById("eventStart").value = startdaytime[1];

        // only full hours are allowed
        const startHour    = startdaytime[1].split(":");
        const startMinutes = startHour[1];

        // increment by 1
        const ihour = Number(startHour[0]) + 1;
        
        // set end time with leading zero
        document.getElementById("eventEnd").value = ihour.toString().padStart(2,"0") + ":" + startMinutes;
        
        const sb_series=document.getElementById("seriesSelect");
        // enable all options
        for (let i=0; i< sb_series.length; i ++) {
            sb_series.options[i].disabled = false;
        }
        // default: once
        sb_series[0].selected = true;
    }

    if (processingMode == MODE.UPDATE) {
        document.getElementById("modalTitle").textContent="Reservierung aktualisieren/löschen";
        document.getElementById("submitButton").value="Aktualisieren";
        document.getElementById("deleteButton").style.display = '';
        
        console.log("Title: ", event.event._def.title );
        
        let title = event.event._def.title.split(": ");
        
        startdaytime = event.event.startStr.split("T");
        enddaytime = event.event.endStr.split("T");
        
        document.getElementById("eventTitle").value = title[1];
        document.getElementById("eventDate").value = startdaytime[0];
        document.getElementById("eventStart").value = startdaytime[1];
        document.getElementById("eventEnd").value = enddaytime[1];

        const sb_series=document.getElementById("seriesSelect");
        
        // disable series frequence
        for (let i=0; i< sb_series.length; i ++) {
            if (i == 0) {
                sb_series.options[i].disabled = false;
            } else {
                sb_series.options[i].disabled = true;
            }
        }
        sb_series[0].selected = true;

        
        // select the saved frequence
        if (exEventIndex != -1) {
            // disable once
            for (let i=0; i< sb_series.length; i ++) {
                if (i == 0) {
                    sb_series.options[i].disabled = true;
                } else {
                    sb_series.options[i].disabled = false;
                }
            }
            
            const selIndex=seriesmap.get(dbevents.events[exEventIndex].rrule.freq + "_" + dbevents.events[exEventIndex].rrule.interval);
            sb_series[selIndex].selected = true;
        }
    }
    // Open modal dialog
    mDialog.style.display = 'block';
    //mDialog.fadeIn(200);
    document.getElementById("eventTitle").focus();
    
}

function closeModalDialog() {
    const mDialog = document.getElementById("eventModal");
    mDialog.style.display = "none";
    /*    
    $("#eventModal").fadeOut(200);
    $("#errors").text("");
    $("#calendar").removeClass("opaque");
    this.mode = MODE.VIEW;
    */
}

async function deleteEvent(event) {
    //let newexdate = [];
    
    if (existingEvent.event._def.groupId != "" ) {
        
        let choice = prompt('Soll der Termin oder die ganze Serie gelöscht werden (T/S) ?');

        if (choice == 'T') {
            const dbeventid= await updateEventinDB( existingEvent.event._def.extendedProps._id,
                                                    dbevents.events[exEventIndex].title,
                                                    dbevents.events[exEventIndex].start,
                                                    dbevents.events[exEventIndex].end,
                                                    dbevents.events[exEventIndex].rrule.freq,
                                                    dbevents.events[exEventIndex].rrule.interval,
                                                    dbevents.events[exEventIndex].rrule.byweekday,
                                                    dbevents.events[exEventIndex].duration,
                                                    existingEvent.event.startStr
                                                );
            
        }
        
        if (choice == 'S') {
            await removeEventfromDB(existingEvent.event._def.extendedProps._id, 
                                    dbevents.events[exEventIndex].title, dbevents.events[exEventIndex].start,
                                    dbevents.events[exEventIndex].end, dbevents.events[exEventIndex].rrule.freq,
                                    dbevents.events[exEventIndex].rrule.interval);
            existingEvent.event.remove();    
        } 
        
    } else {
        await removeEventfromDB(existingEvent.event._def.extendedProps._id,
                                existingEvent.event.title, existingEvent.event.start,
                                existingEvent.event.end, "einmalig", "0");
        existingEvent.event.remove();
    }
        
    closeModalDialog();
    // reload page
    location.reload();
}

async function submitEvent(event) {

    let interval    = null;
    let until       = null;
    let freq        = null;
    let duration    = null;
    let exdate      = [];
    let dbeventid   = null;
    let wday        = null;
    let dtstart     = null;
    let eventid     = null;

    const form=document.getElementById("eventModal");
    if (!form.checkValidity()) {
        alert("Bitte eine Reservierungs-Bezeichnug eingeben");
        return false;
    }
        
    console.log("Bezeichnung: ", document.getElementById("eventTitle").value);

    if (existingEvent.event !== undefined) {
        eventid    = existingEvent.event._def.extendedProps._id;
    }
    let title      = User.user.name + ": " + document.getElementById("eventTitle").value;
    const eventday   = document.getElementById("eventDate").value;
    const eventstart = document.getElementById("eventDate").value + "T" + document.getElementById("eventStart").value;
    const eventend   = document.getElementById("eventDate").value + "T" + document.getElementById("eventEnd").value;
    const startTime  = new Date(eventstart);
    const endTime    = new Date(eventend);

    if (endTime <= startTime) {
        alert("Die Ende-Zeit muss größer als die Start-Zeit sein!");
        return;
    }

    const series = document.getElementById("seriesSelect").value.split('_');

    const series_freq = series[0];
    const series_interval = series[1];

    const date = new Date(eventstart);
    const day = date.getDay();
    const lastdayofYear = new Date(new Date().getFullYear(), 11, 31);

    //const untilday = lastdayofYear.toISOString().split("T");

    const lyear = lastdayofYear.getFullYear();
    const lmonth = String(lastdayofYear.getMonth() + 1).padStart(2, '0');
    const lday = String(lastdayofYear.getDate()).padStart(2, '0');
    let untilday = lyear + "-" + lmonth + "-" + lday;
    

    try {
        if (processingMode == MODE.CREATE) {

            switch (series_freq) {
                case "once":
                    console.log("Serie: " + series + " " + wdays[day]);
                    errorText="";
                    if (eventsmap.has(eventday)) {
                        if (checkTimeOverlapping(eventid, eventday, eventstart, eventend)) {
                            alert('❌ Überschneidung am ' + eventday + "\n" + title + "\n" + eventstart.split('T')[1] + " - " + eventend.split('T')[1]
                                + "\n" + errorText);
                            return false;
                        }
                    }
                    dbeventid= await saveEventtoDB(User.user.id, title, eventstart, eventend, null, freq, interval, wday, until, dtstart, duration, exdate);
                    return dbeventid;
                break;
                case "weekly":
                    console.log("Serie: " + series + " " + wdays[day]);
                    
                    interval = series_interval;
                    until = untilday;    //'2025-12-31';
                    freq = 'weekly';
                    duration = getduration(eventstart, eventend);
                    const daytime = eventstart.split("T");

                    for (let i = 0; i < aholidays.length; i++) {
                        exdate [i] = aholidays[i] + "T" + daytime[1];
                    }
                    
                    
                    wday    = wdays[day];
                    dtstart = eventstart;

                    //let groupID = "test_1";
                    // create groupId
                    if (groupNo === null) {
                        groupId = User.user.name +"_" + 1;
                    }
                    else {
                        // increment groupNo
                        groupNo++;
                        groupId = User.user.name + "_" + groupNo;

                    }
                    console.log("GROUPID: ", groupId);

                    if (checkSeriesConflict(title, eventstart, eventend, interval, until)) {
                        return false;
                    }
                    
                    dbeventid= await saveEventtoDB(User.user.id, title, eventstart, eventend, groupId, freq, interval, wdays[day], dtstart, until, duration, exdate);
                    return dbeventid;
                    
                break;

                default:
                    console.log("Unbekannte Serie !");
            }
        }
        if (processingMode == MODE.UPDATE) {
            exdate= null;

            switch (series_freq) {
                case "once":
                    errorText="";
                    if (eventsmap.has(eventday)) {
                        if (checkTimeOverlapping(eventid, eventday, eventstart, eventend)) {
                            alert('❌ Überschneidung am ' + eventday + "\n" + title + "\n" + eventstart.split('T')[1] + " - " + eventend.split('T')[1]
                            + "\n" + errorText);
                            return false;
                        }
                    }
                break;
                case "weekly":
                    freq = 'weekly';
                    interval = series_interval;
                    until = untilday;
                    duration = getduration(eventstart, eventend);
                    wday    = wdays[day];
                    dtstart = eventstart;
                    title = existingEvent.event._def.title;
                    if (checkSeriesConflict(title, eventstart, eventend, interval, until)) {
                        return false;
                    }
                break;
                default:
                    console.log("Unbekannte Serie !");
            }

            title = existingEvent.event._def.title;
            
            dbeventid= await updateEventinDB(existingEvent.event._def.extendedProps._id, title, eventstart, eventend, freq, interval, wday, duration, exdate);
        }

    } catch (err) {
        alert('Fehler beim Anlegen oder beim Aktualisieren der Reservierung' + err?.message || 'Unbekannter Fehler');
        return false;
    } 
}

async function saveEventtoDB(userid, title, start, end, groupId, freq, interval, byweekday, dtstart, until, duration, exdate) {
    console.log("saveEventtoDB: <" + userid + "> <" + title + "> <" + start + "> <" + end +">" );

    try {
        //const response = await fetch('http://localhost:3000/api/saveEvent', {
        const response = await fetch('api/saveEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid,
                title,
                start,
                end,
                groupId,
                freq,
                interval,
                byweekday,
                dtstart,
                until,
                duration,
                exdate
            })
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
        } else {
            const event= await response.json();
            console.log("reponse: ", event.event.dbeventid);
            return event.event.dbeventid;
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Speichern des Events ' + err.message ? err.message: 'Unbekannter Fehler');
        return 0;
    }
}

async function updateEventinDB(eventid, title, start, end, freq, interval, weekday, duration, exdate) {
    console.log("updateEventinDB: <" + eventid + "> <" + title + "> <" + start + "> <" + end +">" );

    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/updateEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventid,
                title,
                start,
                end,
                freq,
                interval,
                weekday,
                duration,
                exdate
            })
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
        } else {
            const event= await response.json();
            console.log("reponse: ", event.eventid);
            return event.eventid;
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Updaten des Events ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}


async function removeEventfromDB(eventid, title, start, end, freq, interval) {
    console.log("removeEventfromDB: <" + eventid + ">");

    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/deleteEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventid,
                title,
                start,
                end,
                freq,
                interval
            })
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Löschen des Events ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

async function getEventsfromDB() {
    let dbevents=[];
    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/getEvents', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            
        dbevents = await response.json();
        return dbevents;

        } else {
            if (!response.ok) {
                const { errors } = await response.json();
                let testerr=errors[0].msg;
                throw new Error(testerr);
            }
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Holen des Events ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

async function getGroupID(username) {
    
    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/getgroupID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {
                username
            })
        });

        if (response.ok) {
            
        let groupId = await response.json();
        return groupId;

        } else {
            if (!response.ok) {
                const { errors } = await response.json();
                let testerr=errors[0].msg;
                throw new Error(testerr);
            }
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Ermiiteln der Group ID ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

async function getpublicHolidays(startyear, endyear) {
    let pholidays=[];
    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/getHolidays', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( {
                startyear,
                endyear
            } )
        });

        if (response.ok) {
            
        pholidays = await response.json();
        return pholidays;

        } else {
            if (!response.ok) {
                const { errors } = await response.json();
                let testerr=errors[0].msg;
                throw new Error(testerr);
            }
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim beim Ermiiteln der öffentlichen Feiertage ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

function isHoliday(day) {
    let result = false;
    for (let i= 0; i<aholidays.length;i++) {
        if (day === aholidays[i]) {
            result = true;
        }
    }
    return result;

}

function isClosed(day) {
    let result = false;
    for (let i= 0; i<aclosed.length;i++) {
        if (day === aclosed[i]) {
            result = true;
        }
    }
    return result;

}

function getduration(datestart, datend) {
    let result = "";
    
    const startTime = new Date(datestart); 
    const endTime = new Date(datend);

    // Calculate the difference in milliseconds
    const durationMs = endTime - startTime;

    // Convert milliseconds to hours and minutes
    let hours = (Math.floor(durationMs / (1000 * 60 * 60))).toString();
    let minutes = (Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))).toString();

    // leading zero
    if (hours.length == 1) {
        hours = "0" + hours;
    }
    if (minutes.length == 1) {
        minutes = "0" + minutes;
    }

    result = hours + ":" + minutes;

    return result;

}

function getEvIndex(evgroupid) {
    let result = -1;
    for (let i = 0; i < dbevents.events.length; i++) {
        if (User.user.id === dbevents.events[i].userid || User.user.name === 'Administrator') {
            if (evgroupid === dbevents.events[i].groupId) {
                result = i;
            }
        }
    }
    return result;
}

function postCheckOverlapping () {
    let bbsevents = [];
    bbsevents = calendar.getEvents();

    for (let i = 0; i < bbsevents.length; i++) {
        if (bbsevents[i].allDay === false) {
            console.log("Event: [" + i + "] " + bbsevents[i].startStr + " " + bbsevents[i].title)
        }
    }
}

function filleventsmap(event) {
    let eventarr = [];
    let eventdetail = {};

    let eventday = event.start.split('T')[0];
    
    eventdetail._id = event._id;
    eventdetail.title = event.title;
    eventdetail.start = event.start.split('T')[1];
    eventdetail.end = event.end.split('T')[1];
    eventarr.push(eventdetail);

    // handle single event
    if (eventsmap.has(eventday)) {
        addMultiEvent(eventday, eventdetail);
    } else {
        eventsmap.set(eventday, eventarr);
    }
    
    if (event.groupId === null ) {
        return;
    }

    // handle event series
    let interval = event.rrule.interval;
    let until    = event.rrule.until;

    let startdate = new Date(eventday);
    let currentyear = startdate.getFullYear();
    let untilDate = new Date(until);

    while (startdate < untilDate) {
        // determine dates of the weekly recurring events
        startdate.setDate(startdate.getDate() + interval * 7);
        const year = startdate.getFullYear();
        if (year === currentyear) {
            if (startdate.getTime() != untilDate.getTime()) {
                const month = String(startdate.getMonth() + 1).padStart(2, '0');
                const day = String(startdate.getDate()).padStart(2, '0');
                let eventday = year + "-" + month + "-" + day;
                if (eventsmap.has(eventday)) {
                    addMultiEvent(eventday, eventdetail);
                } else {
                    eventsmap.set(eventday, eventarr);
                } 
            }
        }
    }
    
    // remove deleted series-event from map
    let exday="";
    let extime="";
    
    if (event.exdate.length > closedDays) {
        for (let i = closedDays; i < event.exdate.length; i++) {
            exday=event.exdate[i].split('T')[0]; 
            extime=event.exdate[i].split('T')[1]; 
            if (eventsmap.has(exday)) {
                removeEvent(exday, extime);  
            }
        }
    }

}

function addMultiEvent(evday, evdetail) {

    let extendtimearr=[];
    let timerange=[];
    
    timerange = eventsmap.get(evday);
    //copy all properties to the new array 
    Object.assign(extendtimearr,timerange);
    extendtimearr.push(evdetail);
    
    eventsmap.set(evday, extendtimearr);
}

function removeEvent(evday, evtime) {

    let extendtimearr=[];
    let timerange=[];
    
    timerange = eventsmap.get(evday);
    //copy all properties to the new array 
    Object.assign(extendtimearr,timerange);

    for (let i = 0; i < extendtimearr.length; i++) {
        if (extendtimearr[i].start === evtime) {
            const removed = extendtimearr.splice(i, 1);
            console.log("removed: ", removed)
        }
    }
    
    eventsmap.set(evday, extendtimearr);
}

function checkSeriesConflict(stitle, sstart, send, sinterval, suntil) {
    let eventid = null;

    if (existingEvent.event !== undefined) {
        eventid    = existingEvent.event._def.extendedProps._id;
    }
     
    let result      = false;
    let startdate   = new Date(sstart.split('T')[0]);
    let currentyear = startdate.getFullYear();
    let untilDate   = new Date(suntil);

    errorText="";

    while (startdate < untilDate) {
        const year = startdate.getFullYear();
        if (year === currentyear) {
            if (startdate.getTime() != untilDate.getTime()) {
                const month = String(startdate.getMonth() + 1).padStart(2, '0');
                const day = String(startdate.getDate()).padStart(2, '0');
                let eventday = year + "-" + month + "-" + day;
                if (eventsmap.has(eventday)) {
                  if (checkTimeOverlapping(eventid, eventday, sstart, send)) {
                            alert('❌ Überschneidung am ' + eventday + "\n" + stitle + "\n" + sstart.split('T')[1] + " - " + send.split('T')[1]
                                + "\n" + errorText);
                            result= true;
                            break;
                    }  
                } 
                startdate.setDate(startdate.getDate() + sinterval * 7);
            }
        }
    }
    return result;

}


function checkTimeOverlapping (eventid, day, start, end) {
    let result = false;

    for (let i = 0; i < eventsmap.get(day).length; i++) {
        console.log("title: ", eventsmap.get(day)[i].title);
        console.log("start: ", eventsmap.get(day)[i].start);
        console.log("end: ", eventsmap.get(day)[i].end);

        if (eventid !== null) {
            if (eventsmap.get(day)[i]._id === eventid) {
                // avoid conflict with oneself
                continue;
            }
        }

        // new start time is greater than start time and lower than end time of the existing event
        if (start.split('T')[1] >= eventsmap.get(day)[i].start && start.split('T')[1] <= eventsmap.get(day)[i].end) {
            errorText = "Konflikt mit " + eventsmap.get(day)[i].title + "\n" + eventsmap.get(day)[i].start + " - " + eventsmap.get(day)[i].end;
            result = true;
            break;
        }
        // new end time is greater than start time and lower than end time of the existing event
        if (end.split('T')[1] > eventsmap.get(day)[i].start && end.split('T')[1] < eventsmap.get(day)[i].end) {
            errorText = "Konflikt mit " + eventsmap.get(day)[i].title + "\n" + eventsmap.get(day)[i].start + " - " + eventsmap.get(day)[i].end;
            result = true;
            break;
        }
        // new start time is lower than start time and end time greater than end time of the existing event
        if (start.split('T')[1] < eventsmap.get(day)[i].start && end.split('T')[1] > eventsmap.get(day)[i].end) {
            errorText = "Konflikt mit " + eventsmap.get(day)[i].title + "\n" + eventsmap.get(day)[i].start + " - " + eventsmap.get(day)[i].end;
            result = true;
            break;
        }
    }
        
    return result;
}