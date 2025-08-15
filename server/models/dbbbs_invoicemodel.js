import mongoose from 'mongoose';

const Schema=mongoose.Schema;

const bbsInvoiceSchema = new Schema({

    inv_no : {
        type: String
    },
    inv_date : {
        type: String
    },
    inv_amount: {
        type: String
    },
    inv_payment: {
        type: String
    },
    inv_status: {
        type: String
    },
    userid: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }
});

const dbbbsinvoice = mongoose.model('Invoice', bbsInvoiceSchema);
//module.exports = dbbbsuser;
export default dbbbsinvoice;