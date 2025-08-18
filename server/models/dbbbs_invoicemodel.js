import mongoose from 'mongoose';

const Schema=mongoose.Schema;

const bbsInvoiceSchema = new Schema({

    inv_no : {
        type: String
    },
    inv_date : {
        type: String
    },
    inv_payment: {
        type: String
    },
    inv_status: {
        type: String
    },
    inv_drink_total: {
        type: String
    },
    inv_charge_total: {
        type: String
    },
    inv_drinks_total: {
        type: String
    },
    inv_charge_total: {
        type: String
    },
    inv_amount: {
        type: String
    },
    userid: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }
});

const dbbbsinvoice = mongoose.model('Invoice', bbsInvoiceSchema);
export default dbbbsinvoice;