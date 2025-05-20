import mongoose from 'mongoose';

const Schema=mongoose.Schema;

const bbsEventSchema = new Schema({

    title : {
        type: String
    },
    start : {
        type: String
    },
    end: {
        type: String
    },
    userid: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }
});

const dbbbsevent = mongoose.model('Event', bbsEventSchema);
//module.exports = dbbbsuser;
export default dbbbsevent;