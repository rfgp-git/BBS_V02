// global
let User={};
let myinvoices = [];

function init() {

    setUser();
    
    create_invoice_table_data();

}

function setUser() {
    
    let retString = localStorage.getItem("ActiveUser");
    let menuItem1 = document.getElementById("Menu_Profile1");
    let menuItem2 = document.getElementById("Menu_Profile2");
    
    if (retString != null) {
        // Convert the JSON string back to an array
        User = JSON.parse(retString);
        console.log("User: ", User.user.name + " " + User.user.id);

        // change profile name of menu
        menuItem1.textContent = User.user.name; 
        // change profile name of drawer
        menuItem2.textContent = User.user.name;
    } else {
        menuItem1.textContent = 'Error';
        menuItem2.textContent = 'Error';
    }
}

async function create_invoice_table_data() {

    const tbl_invoice = document.getElementById('invoice_table');
    // empty table
    for(let i = 1; i < tbl_invoice.rows.length;){
        tbl_invoice.deleteRow(i);
    }

    let tbl_body = document.getElementById('invoice_table_body');

    myinvoices= await getmyInvoices(User.user.id);

    for (let i=0; i < myinvoices.length; i++)
    {
        let row = "<tr>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + User.user.name + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + myinvoices[i].inv_no + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + myinvoices[i].inv_date + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + myinvoices[i].inv_payment + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + myinvoices[i].inv_status + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + myinvoices[i].inv_drinks_total + "</b>" + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + myinvoices[i].inv_charge_total + "</b>" + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + myinvoices[i].inv_amount + "</b>" + "</td>" +
                    "</tr>";
    
        tbl_body.innerHTML += row;
    }

}

async function getmyInvoices(userid) {
    try {
        const response = await fetch('api/getmyInvoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userid
            })
        });

        if (response.ok) {
            
        myinvoices = await response.json();
        return myinvoices.invoices;

        } else {
            if (!response.ok) {
                const { errors } = await response.json();
                let testerr=errors[0].msg;
                throw new Error(testerr);
            }
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Einlesen der Rechnungen ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

