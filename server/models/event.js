// Dependencies
import DB from '../lib/db.js';

let _ = class Event {

    constructor() {
        this.created = Date.now();
        this.title = null,
        this.start = null,
        this.end = null,
        this.userid = null;
        this.dbeventid = null;
        this.groupId = null;
        this.freq = null;
        this.interval = null;
        this.byweekday = null;
        this.dtstart = null;
        this.until = null;
        this.duration = null;
        this.exdate = null;
    }

    // save event to the database
    save() {
        //console.log('Successfully saved user to the database:', this.id);
        const dbeventid=DB.saveEvent(this);
        return dbeventid;
       
    }

    // delete event from the database
    delete(eventID) {
        
        DB.deleteEvent(eventID);
       
    }

    // find a event with given id
    find(id) {
        return '';
    }

    setTitle(title) {
        this.title=title;
    }

    setStartPoint(start) {
        this.start=start;
    }
    setEndPoint(end) {
        this.end=end;
    }

    setUserID(userid) {
        this.userid=userid;
    }

    setDBEventID(dbeventid) {
        this.dbeventid=dbeventid;
    }

    setGroupID(groupId) {
        this.groupId=groupId;
    }

    setSeries(freq, interval, byweekday, dtstart, until) {
        this.freq = freq;
        this.interval = interval;
        this.byweekday = byweekday;
        this.dtstart = dtstart;
        this.until = until;
    }

    setDuration(duration) {
        this.duration=duration;
    }

    setExdate(exdate) {
        this.exdate=exdate;
    }
    
}
    
export default _;