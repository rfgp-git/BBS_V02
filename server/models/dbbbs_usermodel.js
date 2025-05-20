import mongoose from 'mongoose';

const Schema=mongoose.Schema;

const bbsuserSchema = new Schema({

    username : {
        type: String
    },
    email : {
        type: String
    },
    password: {
        type: String
    }
});

const dbbbsuser = mongoose.model('User', bbsuserSchema);
//module.exports = dbbbsuser;
export default dbbbsuser;