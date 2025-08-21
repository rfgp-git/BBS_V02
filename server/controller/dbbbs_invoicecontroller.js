import dbbbsinvoice from '../models/dbbbs_invoicemodel.js';

let _ = class DBInvoiceController {

    async dbcreateInvoice(data) {
        try {
            let dbinvoice;
            
            dbinvoice = new dbbbsinvoice({
                inv_no:             data.inv_no,
                inv_date:           data.inv_date,
                inv_payment:        data.inv_payment,
                inv_status:         data.inv_status,
                inv_drinks_total:   data.inv_drinks_total,
                inv_charge_total:   data.inv_charge_total,
                inv_amount:         data.inv_amount,
                userid:             data.userid,
                
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
    */

    async dbgetCurrentNumberOfInvoices(userID) {
        let count=null;
        try {
            // get all invoices of a special user
            //foundinvoice = await dbbbsinvoice.findOne({userid: userID}).sort({seq_no:-1});
            count = await dbbbsinvoice.countDocuments({ userid: userID });
            
            if (count != null) {
                console.log('DBEventController.dbgetCurrentNumberOfInvoices:', count);
                return count;
            } else {
                return false;
            }
           
        } catch (e) {
            console.log(e.message);  
        }
    }

    async dbgetmyInvoices(userID) {
        let foundinvoices = [];
        try {
            // get all invoices
                foundinvoices = await dbbbsinvoice.find({userid: userID});
                if (foundinvoices.length != 0) {
                    console.log('DBEventController.dbfindmyInvoices:', foundinvoices);
                    return foundinvoices;
                } else {
                    return false;
                }

        } catch (e) {
            console.log(e.message);  
        }
        
    }

    async dbupdateInvoice(inv_no, inv_payment, inv_status ) {
        try {
            const dbinvoice = await dbbbsinvoice.findOne({inv_no: inv_no} );
            
            if (inv_payment != '') {
                dbinvoice.inv_payment = inv_payment;
            }

            if (inv_status != '') {
                dbinvoice.inv_status = inv_status;
            }

            dbinvoice.save();

            console.log('Invoice updated', inv_no);
            return inv_no;
        } catch(e) {
            console.log(e.message);
        }
    }
}

export default _;





