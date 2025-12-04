// global
let User={};
let personal_bills = [];

document.getElementById('payin_cash').onclick = btn_cash_clicked;
document.getElementById('payin_cash').ontouchstart = btn_cash_clicked;
document.getElementById('transfer_Bill').onclick = btn_transfer_clicked;
document.getElementById('transfer_Bill').ontouchstart = btn_transfer_clicked;
document.getElementById('close_Bill').onclick = btn_close_clicked; // for Admin
document.getElementById('close_Bill').ontouchstart = btn_close_clicked; // for Admin

document.getElementById('update_personal_data').onclick = btn_updatepsd_clicked;
document.getElementById('update_personal_data').ontouchstart = btn_updatepsd_clicked;


function init() {

    setUser();

    const bar1 = document.getElementById('bill_buttonbar_Bowler');
    const bar2 = document.getElementById('bill_buttonbar_Admin');

    if (User.user.name === 'Administrator') {
        bar1.style.display = "none";
        bar2.style.display = "initial";
    } else {
        bar1.style.display = "initial";
        bar2.style.display = "none";
    }
    
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

    document.getElementById("username").value = User.user.name;
    document.getElementById("contactperson").value = User.user.contact;
    document.getElementById("phone").value = User.user.phone;
    document.getElementById("email").value = User.user.email;

}

async function create_invoice_table_data() {

    let total_sum = 0;

    const tbl_invoice = document.getElementById('invoice_table');
    // empty table
    for(let i = 1; i < tbl_invoice.rows.length;){
        tbl_invoice.deleteRow(i);
    }

    let tbl_body = document.getElementById('invoice_table_body');

    disableButtons(true);

    let inputcheck="<input type=" + '"' + "checkbox" + '"' + " onchange=" + '"' + "ondisableButtons()" + '"' + ">"

    if (User.user.name === 'Administrator') {
        personal_bills= await getallInvoices();
    } else {
        personal_bills= await getmyInvoices(User.user.id);
    }

    for (let i=0; i < personal_bills.length; i++)
    {
        let row = "<tr>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric contenteditable" + "=true"+">" + inputcheck + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + personal_bills[i].inv_contact + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + personal_bills[i].inv_no + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + personal_bills[i].inv_date + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + personal_bills[i].inv_payment + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + personal_bills[i].inv_status + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + personal_bills[i].inv_drinks_total + "</b>" + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + personal_bills[i].inv_charge_total + "</b>" + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + "<b>" + personal_bills[i].inv_amount + "</b>" + "</td>" +
                    "</tr>";
    
        tbl_body.innerHTML += row;
        let dec_amount=parseFloat(personal_bills[i].inv_amount.replace(",", "."));
        total_sum = total_sum + dec_amount;
    }
    total_sum = total_sum.toFixed(2).replace(".", ","); // two decimal places

    // Add total row
    let row = "<tr>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + 'Summe' + '</b>' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                    "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + total_sum + '</b>' + "</td>" +
            "</tr>";

    tbl_body.innerHTML += row;

}

async function getmyInvoices(userid) {
    let result = [];
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
            
        result = await response.json();
        return result.invoices;

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

async function getallInvoices() {
    let result = [];
    try {
        const response = await fetch('api/getallInvoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            
        });

        if (response.ok) {
            
        result = await response.json();
        return result.invoices;

        } else {
            if (!response.ok) {
                const { errors } = await response.json();
                let testerr=errors[0].msg;
                throw new Error(testerr);
            }
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Einlesen aller Rechnungen ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

async function btn_cash_clicked() {
    triggerInvoice('cash');
}

async function btn_transfer_clicked() {
    triggerInvoice('transfer');
}


async function btn_close_clicked() {
    closeInvoice();
}

async function btn_updatepsd_clicked() {
    updatePersonalData();
}

async function triggerInvoice(payment) {

    objinvoice = {};
    let result = false;

    let iTable = document.getElementById('invoice_table');

    let checkboxes = iTable.getElementsByTagName("Input");

    for (let i=0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            let row = checkboxes[i].parentNode.parentNode;
            objinvoice= {
                    "Bill_Contact":     row.cells[1].innerHTML,
                    "Bill_No":          row.cells[2].innerHTML,
                    "Bill_Date":        row.cells[3].innerHTML,
                    "Bill_Payment":     payment,
                    "Bill_DrinkTotal":  row.cells[6].textContent,
                    "Bill_ChargeTotal": row.cells[7].textContent,
                    "Bill_SumTotal":    row.cells[8].textContent,
                    "Bill_Recipient":   User.user.name,
                    "Bill_Status":      'in progress',
                    "Bill_Mail":        User.user.email
            }
            
            result = await generateInvoice(objinvoice);
            
            // change the payment and the status
            if (result == true) {
                await updateInvoice(objinvoice.Bill_No, objinvoice.Bill_Payment, objinvoice.Bill_Status );
                // reload page
                location.reload();
            }
        }
    }
}

async function closeInvoice() {

    objinvoice = {};
    let result = false;

    let iTable = document.getElementById('invoice_table');

    let checkboxes = iTable.getElementsByTagName("Input");

    for (let i=0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            let row = checkboxes[i].parentNode.parentNode;
            objinvoice= {
                    "Bill_Contact":     row.cells[1].innerHTML,
                    "Bill_No":          row.cells[2].innerHTML,
                    "Bill_Date":        row.cells[3].innerHTML,
                    "Bill_Payment":     row.cells[4].innerHTML,
                    "Bill_DrinkTotal":  row.cells[6].textContent,
                    "Bill_ChargeTotal": row.cells[7].textContent,
                    "Bill_SumTotal":    row.cells[8].textContent,
                    "Bill_Recipient":   User.user.name,
                    "Bill_Status":      'closed',
            }
    
            await updateInvoice(objinvoice.Bill_No, objinvoice.Bill_Payment, objinvoice.Bill_Status );
        }
    }
    // reload page
    location.reload();
}

async function generateInvoice(invoicedata) {
        console.log('invoice: ', invoicedata); 
     
        try {
        
        const response = await fetch('api/generateInvoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoicedata)
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
            return false;
        } else {
            alert("Rechnung wurde per E-Mail versandt !");
            return true;
        }

    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Erzeugen der PDF Datei ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}


async function updateInvoice(inv_no, inv_payment, inv_status) {

    try {
        const response = await fetch('api/updateInvoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inv_no,
                inv_payment,
                inv_status
            })
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
        } else {
            const invoice= await response.json();
            console.log("reponse: ", invoice.inv_no);
            return invoice.inv_no;
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Update der Rechnung ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}


async function updatePersonalData() {
    
    let UUser = {};
    
    UUser= {
                    "ID":       User.user.id,
                    "name":     document.getElementById("username").value,
                    "contact":  document.getElementById("contactperson").value,
                    "phone":    document.getElementById("phone").value,
                    "email":    document.getElementById("email").value,
                    "passwd":   document.getElementById("password").value,
            }

    
    try {
        const response = await fetch('api/updateUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UUser
            })
        });

        if (!response.ok) {
            const { errors } = await response.json();
            let testerr=errors[0].msg;
            throw new Error(testerr);
        } else {
            const invoice= await response.json();
            console.log("reponse: ", UUser.ID);
            return UUser.ID;
        }
    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Update der Benutzerdaten ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

function disableButtons(flag) {

    let button1 = document.getElementById("payin_cash");
    let button2 = document.getElementById("transfer_Bill");
    let button3 = document.getElementById("close_Bill");

    let input1 = document.getElementById("username");
    let input2 = document.getElementById("contactperson");

    button1.disabled = flag;
    button2.disabled = flag;
    button3.disabled = flag;

    input1.disabled = flag;
    input2.disabled = flag;

}

function ondisableButtons() {

    let buttonbardisabled = true;
    let button1 = document.getElementById("payin_cash");
    let button2 = document.getElementById("transfer_Bill");
    let button3 = document.getElementById("close_Bill");

    const table = document.getElementById("invoice_table");

    // Get the total number of rows incl. header
    let totalRows = table.rows.length;
    totalRows--; // row with total

    const checkboxes = document.querySelectorAll('#invoice_table input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
        if (checkbox.checked == false) {
            totalRows--;
        }
    });

    if (totalRows == 1) {
        buttonbardisabled = true;
    } else {
        buttonbardisabled = false;
    }

    button1.disabled = buttonbardisabled;
    button2.disabled = buttonbardisabled;
    button3.disabled = buttonbardisabled;
    
}

