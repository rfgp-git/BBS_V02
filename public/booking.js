let User = {};
let calendar;
let aholidays = [];
let startyear;
let endyear;
let processingMode;
let existingEvent = {};
let exEventIndex = -1;
let dbevents = [];

const MODE = {
    VIEW: 1,
    UPDATE: 2,
    CREATE: 3
}

const wdays = ['So', 'Mo', 'Tu', 'We', 'Tu', 'Fr', 'Sa'];
let seriesmap = new Map();

window.onload = async () => {
    
    seriesmap.set('once',0);
    seriesmap.set('weekly_1',1);
    seriesmap.set('weekly_2',2);
    seriesmap.set('weekly_3',3);


    if (!sessionStorage.getItem('isAuthenticated')) {
        alert('Zugriff verweigert');
        window.location.href = 'index.html';
    } else {

        try {

            const response = await fetch('api/user', {
                method: 'GET',
                headers: {
                    'Contetnt-Type': '/application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
            
                User = await response.json();

                document.getElementById('userID').innerHTML = User.user.name;
                
            } else {
                const {msg} = await response.json();
                throw new Error(msg);
            }

        } catch(err) {
            alert('Benutzername konnte nicht ermittelt werden ' + err?.message || 'Unbekannter Fehler');
        }
    }

    console.log("User: ", User.user.name + " " + User.user.id);
    processingMode=MODE.VIEW;

    // get publich holidays
    const currentYear = new Date().getFullYear();
    const pholidays = await getpublicHolidays(startyear, endyear); 
    
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

    for (let i = 0; i < dbevents.events.length; i++) {
        if (User.user.id === dbevents.events[i].userid ) {
            //dbevents.events[i].color='#00ff00';
            dbevents.events[i].color='#4CAF50';
            if (dbevents.events[i].groupId != null) {
                calendar.addEvent(dbevents.events[i]);
            } else {
                calendar.addEvent({
                    title:  dbevents.events[i].title,
                    start:  dbevents.events[i].start,
                    end:    dbevents.events[i].end,
                    color:  '#4E95D9',
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
            dbevents.events[i].color     = '#808080'; 
            if (dbevents.events[i].groupId != null) {
                calendar.addEvent(dbevents.events[i]);
            } else {
                calendar.addEvent({
                    title:  dbevents.events[i].title,
                    start:  dbevents.events[i].start,
                    end:    dbevents.events[i].end,
                    color:  '#808080',
                    extendedProps: {
                        userid: User.user.id,
                        _id: dbevents.events[i]._id
                    },
                });
            }
        }
    }

    // toolbar actions
    const series_btn = document.getElementById("icon-series");
    series_btn.addEventListener("click", event => {
        alert("Series events to be implemented"); 
    });

    const help_btn = document.getElementById("icon-help");
    help_btn.addEventListener("click", event => {
        alert("Help text to be implemented"); 
    });

    const remove_btn = document.getElementById("icon-remove");
    remove_btn.addEventListener("click", async event => {
         if (confirm('Sollen alle Reservierung gelöscht werden ?')) {
            for (let i = 0; i < dbevents.events.length; i++) {
                if (User.user.id === dbevents.events[i].userid ) {
                    await removeEventfromDB(dbevents.events[i]._id);
                } 
            }
            location.reload();
        }
    });

    const profile_btn = document.getElementById("icon-profile");
    profile_btn.addEventListener("click", event => {
        window.location.href = "./profile.html";
    });

    const logout_btn = document.getElementById("icon-logout");
    logout_btn.addEventListener("click", async (event) => {
        try {
            const response = await fetch('api/logout', {
                method: 'POST',
                headers: {
                    'Contetnt-Type': '/application/json'
                },
                credentials: 'include'
            });

        } catch(err) {
            alert('Logout ist fehlgeschlagen ' + err?.message || 'Unbekannter Fehler');
            window.location.href = 'index.html';
        }
            window.location.href = "./index.html";
    });

    // buttons of modal dialog
    const cancel_btn = document.getElementById("cancelButton");
    cancel_btn.addEventListener("click", event => {
        closeModalDialog();     
    });

    const submit_btn = document.getElementById("submitButton");
    submit_btn.addEventListener("click", event => {
        submitEvent(event);     
    });

    const delete_btn = document.getElementById("deleteButton");
    delete_btn.addEventListener("click", event => {
        deleteEvent(event);     
    });
    

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
        longPressDelay:100,
        hiddenDays: [0],
        locale: 'DE',
        timeZone: 'Europe/Berlin',
        initialView: 'timeGridWeek',
        initialDate: new Date(),
        navLinks: true, // can click day/week names to navigate views
        selectable: true,
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

            // open modal dialog
            processingMode = MODE.CREATE;
            openModalDialog(arg);

        },
        
        eventClick: async function(arg) {
            exEventIndex = -1;
            if (User.user.id === arg.event._def.extendedProps.userid) {
                // update existing event
                existingEvent = arg;
                if (existingEvent.event._def.groupId != "") {
                    exEventIndex = getEvIndex(existingEvent.event._def.groupId);
                }
                    
                processingMode = MODE.UPDATE;
                openModalDialog(arg);
            }
          },
    editable: true,
    dayMaxEvents: true, // allow "more" link when too many events

    /*
    events: [
        // red areas where no events can be dropped
        {
            title: 'Recurring Event',
            //start: '2025-06-17T10:00',
            //end: '2025-06-17T12:00',
            color: '#00ff00',
            groupId: 'groupTest',
            rrule: {
                freq: 'weekly',
                interval: 2,
                byweekday: [ 'Tu'],
                dtstart: '2025-06-17T10:00',

                until: ['2025-12-31'],
            },
            duration: '2:00',
            exdate: '2025-07-01T10:00'
        },
    ]
    */
    
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
            // reload paege
            location.reload();
        }
        
        if (choice == 'S') {
            await removeEventfromDB(existingEvent.event._def.extendedProps._id);
            existingEvent.event.remove();    
        } 
        
    } else {
        await removeEventfromDB(existingEvent.event._def.extendedProps._id);
        existingEvent.event.remove();
    }
        
    closeModalDialog();
}

async function submitEvent(event) {

    let interval    = null;
    let until       = null;
    let freq        = null;
    let duration    = null;
    let exdate      = [];
    let dbeventid   = null;
    let groupId     = null;
    let wday        = null;
    let dtstart     = null;

    event.preventDefault();
    
    const form=document.getElementById("eventModal");
    
    if (form.checkValidity()) {
        form.submit();
    } else {
        alert("Bitte eine Reservierungs-Bezeichnug eingeben");
        return;
    }

    console.log("Bezeichnung: ", document.getElementById("eventTitle").value);

    const title = User.user.name + ": " + document.getElementById("eventTitle").value;
    const eventstart = document.getElementById("eventDate").value + "T" + document.getElementById("eventStart").value;
    const eventend = document.getElementById("eventDate").value + "T" + document.getElementById("eventEnd").value;
    const series = document.getElementById("seriesSelect").value.split('_');

    const series_freq = series[0];
    const series_interval = series[1];

    const date = new Date(eventstart);
    const day = date.getDay();
    const lastdayofYear = new Date(new Date().getFullYear(), 11, 31);
    const untilday = lastdayofYear.toISOString().split("T");
    

    try {
        if (processingMode == MODE.CREATE) {

            switch (series_freq) {
                case "once":
                    console.log("Serie: " + series + " " + wdays[day]);
                    dbeventid= await saveEventtoDB(User.user.id, title, eventstart, eventend, groupId, freq, interval, wday, until, dtstart, duration, exdate);
                break;
                case "weekly":
                    console.log("Serie: " + series + " " + wdays[day]);
                    interval = series_interval;
                    until = untilday[0];    //'2025-12-31';
                    freq = 'weekly';
                    duration = getduration(eventstart, eventend);
                    const daytime = eventstart.split("T");

                    for (let i = 0; i < aholidays.length; i++) {
                        exdate [i] = aholidays[i] + "T" + daytime[1];
                    }
                    
                    groupId = await getGroupID(User.user.name);
                    //let groupID = "test_1";
                    console.log("GROUPID: ", groupId);
                    wday    = wdays[day];
                    dtstart = eventstart;
                    
                    dbeventid= await saveEventtoDB(User.user.id, title, eventstart, eventend, groupId, freq, interval, wdays[day], dtstart, until, duration, exdate);
                    
                break;

                default:
                    console.log("Unbekannte Serie !");
            }
        }
        if (processingMode == MODE.UPDATE) {
            exdate= null;

            switch (series_freq) {
                case "once":
                    
                break;
                case "weekly":
                    freq = 'weekly';
                    interval = series_interval;
                    duration = getduration(eventstart, eventend);
                    wday    = wdays[day];
                    dtstart = eventstart;
                break;
                default:
                    console.log("Unbekannte Serie !");
            }
            
            dbeventid= await updateEventinDB(existingEvent.event._def.extendedProps._id, title, eventstart, eventend, freq, interval, wday, duration, exdate);
        }

    } catch (err) {
        alert('Fehler beim Anlegen oder beim Aktualisieren der Reservierung' + err?.message || 'Unbekannter Fehler');
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


async function removeEventfromDB(eventid) {
    console.log("removeEventfromDB: <" + eventid + ">");

    try {
        //const response = await fetch('http://localhost:3000/api/register', {
        const response = await fetch('api/deleteEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventid
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
        alert ('Fehler beim Speichern des Events ' + err.message ? err.message: 'Unbekannter Fehler');
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
        if (User.user.id === dbevents.events[i].userid ) {
            if (evgroupid === dbevents.events[i].groupId) {
                result = i;
            }
        }
    }
    return result;
}