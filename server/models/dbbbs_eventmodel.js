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
    },
    groupId: {
        type: String
    },
    rrule: {
        freq:       String,
        interval:   Number,
        byweekday:  [String],
        dtstart:    String,
        until:      String
    },
    duration: {
        type: String
    },
    exdate: {
        type: [String]
    },
});

const dbbbsevent = mongoose.model('Event', bbsEventSchema);
//module.exports = dbbbsuser;
export default dbbbsevent;