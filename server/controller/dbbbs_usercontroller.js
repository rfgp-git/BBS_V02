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
        let foundid = false;
        try {
            foundid = await dbbbsuser.findById(id);
            if (foundid) {
                console.log('DBUserController.dbfinduserbyID:', foundid);
                return foundid;
            } else {
                return false;
            }
            
        } catch (e) {
            console.log(e.message);  
        }
        
    }
    
    async dbcreateUser(data) {
        try {
            let user= new dbbbsuser({
                username:   data.username,
                email:      data.email,
                password:   data.password
            });

            const existingUser = await dbbbsuser.findOne({
                $or: [{ username: user.username }, { email: user.email }],
            });

            if (existingUser) {
                console.log('User already exists:', existingUser);
            } else {
                await user.save();
                console.log('User saved', user);
            }
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





