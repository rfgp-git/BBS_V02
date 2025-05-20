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
        //console.log('setUserName: ', username);
        this.title=title;
    }

    setStartPoint(start) {
        //console.log('setEMail: ', email);
        this.start=start;
    }
    setEndPoint(end) {
        //console.log('setEMail: ', email);
        this.end=end;
    }

    setUserID(userid) {
        //console.log('setEMail: ', email);
        this.userid=userid;
    }

    setDBEventID(dbeventid) {
        //console.log('setEMail: ', email);
        this.dbeventid=dbeventid;
    }
}
    
export default _;