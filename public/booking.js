let User = {};
let calendar;
let aholidays = [];
let startyear;
let endyear;
let processingMode;
let existingEvent = {};

const MODE = {
    VIEW: 1,
    UPDATE: 2,
    CREATE: 3
}


window.onload = async () => {
    
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
    const dbevents = await getEventsfromDB();

    for (let i = 0; i < dbevents.events.length; i++) {
        if (User.user.id === dbevents.events[i].userid ) {
            dbevents.events[i].color='#00ff00';
        } else {
            dbevents.events[i].overlap   = false,
            dbevents.events[i].editable  = false,
            dbevents.events[i].draggable = false,
            dbevents.events[i].allow     = false,
            dbevents.events[i].color     = '#808080'; 
        }
        
        calendar.addEvent(dbevents.events[i]);
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
        longPressDelay:1000,
        hiddenDays: [0],
        locale: 'DE',
        timeZone: 'Europe/Berlin',
        initialView: 'timeGridWeek',
        initialDate: new Date(),
        navLinks: true, // can click day/week names to navigate views
        selectable: true,
        droppable: true,
        selectMirror: true,
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

            //calendar.unselect();
        },
        /*
            eventChange: async function (info) {
            let updatedEvent = info.event;
            console.log("eventChanged: ", updatedEvent.startStr);
            console.log("eventChanged: ", updatedEvent.endStr);
            //updatedEvent.setProp('color','#6080D3');
            const dbeventid= await updateEventinDB(updatedEvent._def.extendedProps._id, updatedEvent.title, updatedEvent.startStr, updatedEvent.endStr );
        },
        */
        eventClick: async function(arg) {

            if (User.user.id === arg.event._def.extendedProps.userid) {
                // update existing event
                existingEvent = arg;
                processingMode = MODE.UPDATE;
                openModalDialog(arg);
            }
          },
    editable: true,
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
    console.log("delete: ", event);
    await removeEventfromDB(existingEvent.event._def.extendedProps._id);
    existingEvent.event.remove();
    closeModalDialog();
}

async function submitEvent(event) {
    console.log("submit");
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

    try {
        if (processingMode == MODE.CREATE) {
            const dbeventid= await saveEventtoDB(User.user.id, title, eventstart, eventend );
            
            calendar.addEvent({
                title: title,
                start: eventstart,
                end: eventend,
                allDay: event.allDay,
                color: '#5BC26D',
                extendedProps: {
                    userid: User.user.id,
                    _id: dbeventid
                }
            });
        }

        if (processingMode == MODE.UPDATE) {
            const dbeventid= await updateEventinDB(existingEvent.event._def.extendedProps._id, title, eventstart, eventend );
            existingEvent.event.setProp('title', title);
            existingEvent.event.setStart(eventstart);
            existingEvent.event.setEnd(eventend);
            
            //existingEvent.event.startStr = eventstart;
            //existingEvent.event.endStr = eventend;
            /*
            let startDate= new Date(eventstart);
            let endDate= new Date(eventend);
            existingEvent.event.setStart(startDate);
            existingEvent.event.setEnd(endDate);
            //calendar.updateEvent('updateEvent',existingEvent);
            calendar.refetchEvents();
            */
        }
    } catch (err) {
        alert('Fehler beim Anlegen oder beim Aktualisieren der Reservierung' + err?.message || 'Unbekannter Fehler');
    }
}

async function saveEventtoDB(userid, title, start, end) {
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
                end
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

async function updateEventinDB(eventid, title, start, end) {
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
                end
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