// Dependencies
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import DB from '../lib/db.js';
import lodash from 'lodash';

let _ = class User {

    constructor() {
        this.created = Date.now();
        this.id = uuidv4();
        this.username = null,
        this.contact = null,
        this.phone = null,
        this.email = null,
        this.password = null,
        this.role = null,
        this.banned = false;
    }

    // save user to the database
    save() {
        //console.log('Successfully saved user to the database:', this.id);
        DB.write(this);
       
    }

    // find a user with given id
    find(id) {
        return '';
    }

    setUserName(username) {
        //console.log('setUserName: ', username);
        this.username=username;
    }

    setContactPerson(contact) {
        this.contact=contact;
    }

    setPhoneNo(phone) {
        this.phone=phone;
    }


    setEMail(email) {
        //console.log('setEMail: ', email);
        this.email=email;
    }

    async setPassword(password) {
        //console.log('setPassword: ', password);
        let s = password;
        let count = {};

        for (let i = 0; i < s.length; i++) {
        let char = s[i];
            if (isSpecialCharacter(char)) {
                count[char] = (count[char] || 0) + 1;
            }
        }

        let repeat = Object.values(count).some(count => count > 1);
        //console.log('repeat:',repeat);

        if (repeat === false) {
            this.password = await bcrypt.hash(password,10);
            return true;
        }
        else {
            console.log("Sonderzeichen wird mehrfach verwendet");
            return false;
        }
    }

    setUserRole(role) {
        this.role=role;
    }

    async parseUser() {
        console.log('parseUser2')
        try {

            let record=lodash.cloneDeep(this);
           
            delete record.id;
            delete record.created;
            delete record.password;
            delete record.banned;

            return record;

        } catch(e) {
            throw new Error(e);
        }

    }
    
};

function isSpecialCharacter(char) {
    const specialChars = new Set('!@#$%^&*(),.?":{}|<>');
    return specialChars.has(char);
}



export default _;