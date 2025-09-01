import dbbbsuser from '../models/dbbbs_usermodel.js';

let _ = class DBUserController {

    async dbfinduserbyName(name) {
        let user = false;
        try {
            user = await dbbbsuser.findOne({username: name});
            if (user) {
                console.log('DBUserController.dbfinduserbyName:', user);
                return user;
            } else {
                return false;
            }
            
        } catch (e) {
            console.log(e.message);  
        }
        
    }

    async dbfinduserbyID(id) {
        let founduser = null;
        try {
            founduser = await dbbbsuser.findById(id);
            console.log('DBUserController.dbfinduserbyID:', founduser);
            return founduser;
        } catch (e) {
            console.log(e.message);  
        }
    }
    
    async dbcreateUser(data) {
        try {
            let user= new dbbbsuser({
                username:   data.username,
                contact:    data.contact,
                phone:      data.phone,
                email:      data.email,
                password:   data.password,
                role:       data.role
            });

            const existingUser = await dbbbsuser.findOne({
                $or: [{ username: user.username }, { email: user.email }],
            });

            if (existingUser) {
                console.log('User already exists:', existingUser);
                return false;
            } else {
                await user.save();
                console.log('User saved', user);
                return true;
            }
        } catch(e) {
            console.log(e.message);
            return false;
        }
    }

    async dbupdateUser(usr_ID, usr_name, usr_contact, usr_phone, usr_email, usr_passwd ) {
        try {
            const dbuser = await dbbbsuser.findOne({_id: usr_ID} );
            
            if (usr_name)      { dbuser.username   = usr_name;     }
            if (usr_contact)   { dbuser.contact    = usr_contact;  }
            if (usr_phone)     { dbuser.phone      = usr_phone;    }
            if (usr_email)     { dbuser.email      = usr_email;    }
            if (usr_passwd)    { dbuser.password   = usr_passwd;   }

            dbuser.save();

            console.log('User updated', usr_ID);
            return usr_ID;
        } catch(e) {
            console.log(e.message);
        }
    }
}

export default _;

/*
const index = dbbbsuser.find({}, (err, users) => {

    if (err) {
        console.error(err);
        return
    } 

    if (users.length == 0) {
        console.log('No record found');
        return
    }

    console.log(users);

});
*/





