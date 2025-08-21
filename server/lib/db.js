import DBUserController from '../controller/dbbbs_usercontroller.js';
import DBEventController from '../controller/dbbbs_eventcontroller.js';
import DBInvoiceController from '../controller/dbbbs_invoicecontroller.js';

let _ = class DB {

    // handling of invoices
    static saveInvoice(data) {
        
        if (data) {
            //this.localStorage.push(data);
            //console.log('database local storage:', this.localStorage);
            const invoicecontroller = new DBInvoiceController();
            // create Event in DB 
            const dbinvoiceid = invoicecontroller.dbcreateInvoice(data);
            return dbinvoiceid;
        }
        return false;
    };

    // get all invoices
    async getmyInvoices(userID) {
        let invoices = [];
                
        const invoicecontroller = new DBInvoiceController();
        
        invoices = await invoicecontroller.dbgetmyInvoices(userID);
        console.log('DB.getmyInvoices: ',invoices);
        
        return invoices;
        
    };

    // get last invoice
    async getlastInvoiceNo(userID) {
        let invoiceno;
                
        const invoicecontroller = new DBInvoiceController();
        
        invoiceno = await invoicecontroller.dbgetCurrentNumberOfInvoices(userID);
        console.log('DB.getlastInvoiceNo: ',invoiceno);
        
        return invoiceno;
        
    };

    // update invoice
    static async updateInvoice(inv_no, inv_payment, inv_status) {
        
        if (inv_no) {
            const invoicecontroller = new DBInvoiceController();
            // update invoice in DB 
            const result = await invoicecontroller.dbupdateInvoice(inv_no, inv_payment, inv_status);
            if (result == 0) {
                return false;
            } else {
                return inv_no;
            }
        }
        return false;
    };

    // handling of events
    static saveEvent(data) {
        
        if (data) {
            //this.localStorage.push(data);
            //console.log('database local storage:', this.localStorage);
            const eventcontroller = new DBEventController();
            // create Event in DB 
            const dbeventid = eventcontroller.dbcreateEvent(data);
            return dbeventid;
        }
        return false;
    };

    // update event
    static async updateEvent(eventID, title, start, stop, freq, interval, weekday, duration, exdate) {
        
        if (eventID) {
            const eventcontroller = new DBEventController();
            // update Event in DB 
            const result = await eventcontroller.dbupdateEvent(eventID, title, start, stop, freq, interval, weekday, duration, exdate);
            if (result == 0) {
                return false;
            } else {
                return eventID;
            }
        }
        return false;
    };

    // delete event
    static async deleteEvent(eventID) {
        
        if (eventID) {
            const eventcontroller = new DBEventController();
            // delete Event from DB 
            const result = await eventcontroller.dbdeleteEvent(eventID);
            if (result == 0) {
                return false;
            } else {
                return eventID;
            }
        }
        return false;
    };

    async getEvents() {
        let events = [];
        console.log('DB.getEvents: ');
        
        const eventcontroller = new DBEventController();
        
        events = await eventcontroller.dbgetEvents();
        console.log('DB.getEvents: ',events);
        
        return events;
    };


    // handling of users
    static write(data) {
        
        if (data) {
            //this.localStorage.push(data);
            //console.log('database local storage:', this.localStorage);
            const usercontroller = new DBUserController();
            // create User in DB 
            usercontroller.dbcreateUser(data);
            return data;
        }
        return false;
    };

    async findOne(id) {
        let user = false;
        console.log('DB.findOne: ',id);

        if (id) {
            const usercontroller = new DBUserController();
            user = await usercontroller.dbfinduserbyID(id);
            console.log('DB.findbyUserID: ',user);
        }

        return user;
    };

    static findbyEmail(email) {
        let user = false;
        if (email) {
            for (let record of this.localStorage){
                if (record.email === email) {
                    user=record;
                }
            }   
        }
        return user;

    };

    async findbyUsername(username) {
        let user = false;
        
        if (username) {
            const usercontroller = new DBUserController();
            user = await usercontroller.dbfinduserbyName(username);
            console.log('DB.findbyUsername: ',user);
            /*
            for (let record of this.localStorage){
                if (record.username === username) {
                    user=record;
                }
            } 
            */

        }


        return user;

    };

}

export default _;

