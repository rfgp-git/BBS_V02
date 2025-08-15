import dbbbsinvoice from '../models/dbbbs_invoicemodel.js';

let _ = class DBInvoiceController {

    async dbcreateInvoice(data) {
        try {
            let dbinvoice;
            
            dbinvoice = new dbbbsinvoice({
                inv_no:      data.inv_no,
                inv_date:    data.inv_date,
                inv_amount:  data.inv_amount,
                inv_payment: data.inv_payment,
                inv_status:  data.inv_status,
                userid:      data.userid,
                
            });
           

            await dbinvoice.save();
            console.log('Invoice saved', dbinvoice);
            return dbinvoice._id;
        } catch(e) {
            console.log(e.message);
        }
    }


    /*
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
        
    }*/
}

export default _;





