// Dependencies
import DB from '../lib/db.js';

let _ = class Invoice {

    constructor() {
        this.created     = Date.now();
        this.inv_no      = null,
        this.inv_date    = null,
        this.inv_amount  = null,
        this.inv_payment = null;
        this.inv_status  = null;
        this.userid      = null;
        this.invoiceid   = null;
    }

    // save event to the database
    save() {
        //console.log('Successfully saved user to the database:', this.id);
        const dbeventid=DB.saveInvoice(this);
        return dbeventid;
       
    }

    // delete event from the database
    delete(invoiceID) {
        
        DB.deleteInvoice(invoiceID);
       
    }

    setInvoiceNo(no) {
        this.inv_no=no;
    }

    setInvoiceDate(date) {
        this.inv_date=date;
    }

    setInvoiceAmount(amount) {
        this.inv_amount=amount;
    }

    setInvoicePayment(payment) {
        this.inv_payment=payment;
    }

    setInvoiceStatus(status) {
        this.inv_status=status;
    }

    setUserID(userid) {
        this.userid=userid;
    }

    setDBInvoiceID(invoiceid) {
        this.invoiceid=invoiceid;
    }
}
    
export default _;