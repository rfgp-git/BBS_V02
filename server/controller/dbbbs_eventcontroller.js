import dbbbsevent from '../models/dbbbs_eventmodel.js';

let _ = class DBEventController {

    async dbcreateEvent(data) {
        try {
            let dbevent;
            if (data.groupId === null){
                dbevent = new dbbbsevent({
                    title:   data.title,
                    start:   data.start,
                    end:     data.end,
                    userid:  data.userid,
                    groupId: data.groupId,
                    //rrule: {},
                    //duration: data.duration,
                    //exdate: data.exdate
                });
            } else {
                dbevent = new dbbbsevent({
                    title:   data.title,
                    start:   data.start,
                    end:     data.end,
                    userid:  data.userid,
                    groupId: data.groupId,
                    rrule: {
                        freq:       data.freq,
                        interval:   data.interval,
                        byweekday:  [data.byweekday],
                        dtstart:    data.dtstart,
                        until:      data.until,
                    },
                    duration: data.duration,
                    exdate: data.exdate
                });
            }

            await dbevent.save();
            console.log('Event saved', dbevent);
            return dbevent._id;
        } catch(e) {
            console.log(e.message);
        }
    }

    async dbupdateEvent(eventID, title, start, end) {
        try {
            const dbevent = await dbbbsevent.findOne({_id: eventID} );
            dbevent.title= title;
            dbevent.start= start;
            dbevent.end= end;

            dbevent.save();

            console.log('Event updated', eventID);
            return eventID;
        } catch(e) {
            console.log(e.message);
        }
    }

    async dbdeleteEvent(eventID) {
        try {
            const result = await dbbbsevent.deleteOne({_id: eventID} );
            console.log('Event removed', result.deletedCount);
            return result.deletedCount;
        } catch(e) {
            console.log(e.message);
        }
    }


    async dbgetEvents() {
        let foundevents = [];
        try {
            foundevents = await dbbbsevent.find();
            if (foundevents.length != 0) {
                console.log('DBEventController.dbfindEvents:', foundevents);
                return foundevents;
            } else {
                return false;
            }
            
        } catch (e) {
            console.log(e.message);  
        }
        
    }
}

export default _;





