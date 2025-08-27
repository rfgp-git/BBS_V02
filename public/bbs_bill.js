
    // global variables
    const { jsPDF } = window.jspdf;
    
    let drinksum = 0; // memorize subtotal
    
    document.getElementById('save_Bill').onclick = btn_save_clicked;
    document.getElementById('new_Bill').onclick = btn_new_clicked;

    // invoice total data
    let objinvoice   = {};
    let ainvheader   = [];
    let drink_total  = 0;
    let charge_total  = 0;
    let sum_total  = 0;
    let User={};

    function init() {
        const adrinks = new Array();
        const acharges = new Array();

        setUser();


        createHeaderTableData();

         // read available drinks incl. prices from drink_list.js
        for (let i = 0; i < drinks.length; i++) {
            let obj_drink = {
                "name":     drinks[i].name,
                "price":    drinks[i].price,
            }
            adrinks.push(obj_drink);
        } 
       
        if (adrinks.length == 0) {
            alert("Keine Getränke gefunden")
        } else { 
            createDrinkTableData(adrinks);
        }

        // read available charges incl. prices from charge_list.js
        for (let i = 0; i < charges.length; i++) {
            let obj_charge = {
                "name":     charges[i].name,
                "price":    charges[i].price,
            }
            acharges.push(obj_charge);
        } 

        if (acharges.length == 0) {
            alert("Keine Gebühren gefunden")
        } else { 
            createChargeTableData(acharges);
        }
    }

    async function createHeaderTableData() {
        const tbl_header = document.getElementById('header_table');
        // empty table
        for(let i = 1; i < tbl_header.rows.length;){
            tbl_header.deleteRow(i);
        }

        let tbl_body = document.getElementById('header_table_body');

        // get current day
        
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        console.log(formattedDate); // Example: "2025-07-24" will be displayed as 24.07.2025
        //let inputdate="<input type=" + '"' + "date" + '"' + "id=" + '"' + "currentDate" + '"' + "value=" + '"' + formattedDate + '"' + "onchange=" + "saveDate(this)" + ">"

        let invoiceno = await generateInvoiceNo(User.user.id);

        let row = "<tr>" +
                        "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + invoiceno + "</td>" +
                        "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + User.user.name + "</td>" +
                        //"<td " + "class=" + "mdl-data-table__cell--non-numeric contenteditable" + "=true" +">" + inputdate + "</td>" +
                        "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + formattedDate + "</td>" +
                   "</tr>";
 
        tbl_body.innerHTML += row;
        
    }
    
    function createDrinkTableData(drink_array) {
        
        const tbl_founddrinks = document.getElementById('drink_table');
        // empty table
        for(let i = 1; i < tbl_founddrinks.rows.length;){
            tbl_founddrinks.deleteRow(i);
        }

        let tbl_body = document.getElementById('drink_table_body');

        let inputno="<input type=" + '"' + "number" + '"' + "min=" + '"' + "0" + '"' + "max=" + '"' + "20" + '"' + "value=" + '"' + "0" + '"' + "onchange=" + "calculate_total(this)" + ">"
            
        for (let i = 0; i < drink_array.length; i++) {

            let row = "<tr>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + drink_array[i].name + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + drink_array[i].price + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric contenteditable" + "=true" +">" + inputno + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '0,00' + "</td>" +
                        "</tr>";
 
                tbl_body.innerHTML += row;      
        }
        // Add total row
                let row = "<tr>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + 'Summe' + '</b>' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + '0,00' + '</b>' + "</td>" +
                        "</tr>";

        tbl_body.innerHTML += row;

    }

    function createChargeTableData(charge_array) {
        
        const tbl_foundcharges = document.getElementById('charges_table');
        // empty table
        for(let i = 1; i < tbl_foundcharges.rows.length;){
            tbl_foundcharges.deleteRow(i);
        }

        let tbl_body = document.getElementById('charges_table_body');

        let inputno="<input type=" + '"' + "number" + '"' + "min=" + '"' + "0" + '"' + "max=" + '"' + "20" + '"' + "value=" + '"' + "0" + '"' + "onchange=" + "calculate_total(this)" + ">"
            
        for (let i = 0; i < charge_array.length; i++) {

            let row = "<tr>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + charge_array[i].name + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + charge_array[i].price + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric contenteditable" + "=true" +">" + inputno + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '0,00' + "</td>" +
                        "</tr>";
 
                tbl_body.innerHTML += row;      
        }
        // Add total row
                let row = "<tr>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + 'Gesamt' + '</b>' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '' + "</td>" +
                                "<td " + "class=" + "mdl-data-table__cell--non-numeric" +">" + '<b>' + '0,00' + '</b>' + "</td>" +
                        "</tr>";

        tbl_body.innerHTML += row;

    }

    function calculate_total(element) {
        let todr_table=0;
        let toch_table=0;
        // calaculate column total
        let qty = element.value;
        let parent = element.closest('tr');
        let price = parent.cells[1].innerHTML;
        console.log("Quantity/Price: " + qty + "/" + price);
        let decprice=parseFloat(price.replace(",", "."));
        let total = qty * decprice;
        total = total.toFixed(2).replace(".", ","); // two decimal places
        parent.cells[3].innerHTML=total;

        // calculate the total sum
        
        todr_table = document.getElementById('drink_table');
        toch_table = document.getElementById('charges_table');
        
        const todr_rows = todr_table.rows; // HTMLCollection of rows
        const toch_rows = toch_table.rows; // HTMLCollection of rows
        let totalsum = 0;
        
        for (let i=1; i<todr_rows.length-1; i++) {
            //console.log(rows[i].cells[3].innerHTML);
            decprice=parseFloat(todr_rows[i].cells[3].innerHTML.replace(",", "."));
            totalsum = totalsum + decprice; 

        }

        drinksum = totalsum; 
        totalsum = totalsum.toFixed(2).replace(".", ","); // two decimal places
        todr_rows[todr_rows.length-1].cells[3].innerHTML='<b>' + totalsum + '</b>'; 

        totalsum = 0;
        for (let i=1; i<toch_rows.length-1; i++) {
            decprice=parseFloat(toch_rows[i].cells[3].innerHTML.replace(",", "."));
            totalsum = totalsum + decprice; 

        }
        
        totalsum = totalsum + drinksum;
        totalsum = totalsum.toFixed(2).replace(".", ","); // two decimal places
        toch_rows[toch_rows.length-1].cells[3].innerHTML='<b>' + totalsum + '</b>'; 
        
    }

    function btn_save_clicked() {
        //alert("Btn save clicked");
        
        gettotalAmounts();

        saveInvoicetoDB(objinvoice);
    }

    function btn_new_clicked() {
        
        location.reload();
        
    }

    

    function gettotalAmounts() {
        //get data of header table
        let hTable = document.getElementById('header_table');

        //gets rows of table
        let rowLength = hTable.rows.length;

        //loops through rows    
        for (let i = 0; i < rowLength; i++){
            //gets cells of current row  
            let hCells = hTable.rows.item(i).cells;

            //gets amount of cells of current row
            let cellLength = hCells.length;

            //loops through each cell in current row
            for(let j = 0; j < cellLength; j++){
                // get your cell info here
                let cellVal = hCells.item(j).innerHTML;
                if (i==1) {
                  ainvheader.push(cellVal);      
                }
            }
      }
      console.log('header: ', ainvheader);
        // get drinks total
        //get data of drink table
        let dTable = document.getElementById('drink_table');

        //gets rows of table
        rowLength = dTable.rows.length;

        //loops through rows    
        for (let i = 0; i < rowLength; i++){
            //gets cells of current row  
            let dCells = dTable.rows.item(i).cells;

            //gets amount of cells of current row
            let cellLength = dCells.length;

            //loops through each cell in current row
            for(let j = 0; j < cellLength; j++){
                // get your cell info here
                let cellVal = dCells.item(j).innerText;
                if (i==rowLength-1 && j==3) {
                    drink_total = cellVal;      
                }
            }
        }
        console.log('drink_total: ', drink_total);

        // get sum total
        //get data of charges table
        let cTable = document.getElementById('charges_table');

        //gets rows of table
        rowLength = cTable.rows.length;

        //loops through rows    
        for (let i = 0; i < rowLength; i++){
            //gets cells of current row  
            let cCells = cTable.rows.item(i).cells;

            //gets amount of cells of current row
            let cellLength = cCells.length;

            //loops through each cell in current row
            for(let j = 0; j < cellLength; j++){
                // get your cell info here
                let cellVal = cCells.item(j).innerText;
                if (i==rowLength-1 && j==3) {
                    sum_total = cellVal;      
                }
            }
        }
        console.log('sum_total: ', sum_total);

        let decsum_total=parseFloat(sum_total.replace(",", "."));
        let decdrink_total=parseFloat(drink_total.replace(",", "."));
        charge_total = decsum_total - decdrink_total;
        charge_total = charge_total.toFixed(2).replace(".", ","); // two decimal places
        console.log('charge_total: ', charge_total);

        objinvoice= {
                        "Bill_No":          ainvheader[0],
                        "Bill_Recipient":   ainvheader[1],
                        "Bill_UserID":      User.user.id,
                        "Bill_Contact":     User.user.contact,
                        "Bill_Date":        ainvheader[2],
                        "Bill_DrinkTotal":  drink_total,
                        "Bill_ChargeTotal": charge_total,
                        "Bill_SumTotal":    sum_total,
        }

    }

async function saveInvoicetoDB(invoicedata) {
        console.log('invoice: ', invoicedata); 
     
        try {
        
        const response = await fetch('api/saveInvoice', {
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
        } else {
            alert("Rechnung in DB gespeichert !")
        }

    } catch (err) {
        console.log('error: ', err);
        alert ('Fehler beim Speichern der Rechnung ' + err.message ? err.message: 'Unbekannter Fehler');
    }
}

async function generateInvoiceNo(userid) {
    let lastinvoiceno;
    try {
        const response = await fetch('api/getlastInvoiceNo', {
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
            
        lastinvoiceno = await response.json();
        
        let new_no = lastinvoiceno + 1;
        
        const currentYear = new Date().getFullYear();

        let new_invoice_no = currentYear + '_' +  User.user.name + '-' + new_no.toString().padStart(3, '0');

        return new_invoice_no;

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



