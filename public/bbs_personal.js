// global
let User={};
let myinvoices = [];

document.getElementById('payin_cash').onclick = btn_cash_clicked;
document.getElementById('transfer_Bill').onclick = btn_transfer_clicked;
//document.getElementById('paypal_Bill').onclick = btn_paypal_clicked;

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

    disableButtons(true);

    let inputcheck="<input type=" + '"' + "checkbox" + '"' + " onchange=" + '"' + "ondisableButtons()" + '"' + ">"

    myinvoices= await getmyInvoices(User.user.id);

    for (let i=0; i < myinvoices.length; i++)
    {
        let row = "<tr>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric contenteditable" + "=true"+">" + inputcheck + "</td>" +
                            "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + User.user.contact + "</td>" +
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

async function btn_cash_clicked() {

    triggerInvoice('cash');
    
}

async function btn_transfer_clicked() {

    triggerInvoice('transfer');
    
}

async function triggerInvoice(payment) {

    objinvoice = {};

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
            }
            let result=await generateInvoice(objinvoice);
            // change the payment and the status
            if (result == true) {
                await updateInvoice(objinvoice.Bill_No, objinvoice.Bill_Payment, objinvoice.Bill_Status );
                // reload page
                location.reload();
            }
        }
    }
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

function disableButtons(flag) {

    let button1 = document.getElementById("payin_cash");
    let button2 = document.getElementById("transfer_Bill");
    let button3 = document.getElementById("paypal_Bill");

    button1.disabled = flag;
    button2.disabled = flag;
    button3.disabled = flag;

}

function ondisableButtons() {

    let buttonbardisabled = true;
    let button1 = document.getElementById("payin_cash");
    let button2 = document.getElementById("transfer_Bill");
    let button3 = document.getElementById("paypal_Bill");

    const table = document.getElementById("invoice_table");

    // Get the total number of rows incl. header
    let totalRows = table.rows.length;

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

