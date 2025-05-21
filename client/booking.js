let User= {};
let calendar;

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
}

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
    //call logout
    //alert("logout clicked");
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

document.addEventListener('DOMContentLoaded', async function() {

    let holiday = ['2025-05-01'];

    const calendarEl = document.getElementById('calendar')
    calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        buttonText: {
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag',
            listMonth: 'Liste',
        },
        hiddenDays: [0],
        locale: 'DE',
        timeZone: 'Europe/London',
        initialDate: new Date(),
        navLinks: true, // can click day/week names to navigate views
        selectable: true,
        selectMirror: true,
        select: async function(arg) {
            console.log('call select start ', arg.startStr);
            console.log('call select end ', arg.endStr);
            console.log('call select 2', holiday[0]);
            let position = arg.startStr.search(holiday[0]);
            if ( position != -1) {
                //if (arg.startStr===holiday[0]) {
                console.log('call unselect');
                calendar.unselect();
                arg.jsEvent.stopPropagation();
                return false;  
            }
    
            var title = prompt('Reservierung für:');
           
            if (title) {
                 title = User.user.name + ": " + title;
                const dbeventid= await saveEventtoDB(User.user.id, title, arg.startStr, arg.endStr );
                console.log('title: ', title );
                
                const bbsevent= calendar.addEvent({
                    title: title,
                    start: arg.startStr,
                    end: arg.endStr,
                    allDay: arg.allDay,
                    color: '#00ff00',
                    extendedProps: {
                        userid: User.user.id,
                        _id: dbeventid
                    }
                })
            }
            calendar.unselect()
        },
        eventChange: async function (info) {
            let updatedEvent = info.event;
            console.log("eventChanged: ", updatedEvent.startStr);
            console.log("eventChanged: ", updatedEvent.endStr);
            //updatedEvent.setProp('color','#6080D3');
            const dbeventid= await updateEventinDB(updatedEvent._def.extendedProps._id, updatedEvent.title, updatedEvent.startStr, updatedEvent.endStr );
        },
        eventClick: async function(arg) {
        if (User.user.id === arg.event._def.extendedProps.userid) {
            if (confirm('Soll die Reservierung gelöscht werden ?')) {
                await removeEventfromDB(arg.event._def.extendedProps._id);
                arg.event.remove()
            }
        }
    },
    editable: true,
    dayMaxEvents: true, // allow "more" link when too many events
    events: [
        // red areas where no events can be dropped
        {
            start: holiday[0],
            end: '2025-05-01',
            overlap: false,
            editable: false,
            draggable: false,
            display: 'background',
            color: '#ff9f89',
        },
    ]
    });

    calendar.render();

});

async function saveEventtoDB(userid, title, start, end) {
    console.log("saveEventtoDB: <" + userid + "> <" + title + "> <" + start + "> <" + end +">" );

    try {
        //const response = await fetch('http://localhost:3000/api/register', {
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

