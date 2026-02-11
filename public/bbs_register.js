
const regformdiv =document.getElementById('bbs-register-form');
const errMsgDiv = document.getElementById('error-message');

regformdiv.addEventListener('click', () => {
    errMsgDiv.innerHTML='';
}),

regformdiv.addEventListener('submit', async(event) => {
        
    event.preventDefault();

    const username = document.getElementById('username').value;
    const contactperson = document.getElementById('contactperson').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    

    if (!username || !contactperson || !phone || !email || !password) {
        errMsgDiv.innerHTML = 'Alle Felder müssen ausgefüllt sein';
        return;
    }

    const phonePattern = /^(\+49|0)[1-9][0-9\s\-()]{7,14}$/;
    if (!phonePattern.test(phone)) {
      event.preventDefault();
      errMsgDiv.innerHTML = 'Bitt eine Telefon Nummer beginnend mit +49 oder 0 und keine Trennzeichen eingeben !';
      return;
    }

    try {
        //const response = await fetch('http://localhost:3000/api/register', {
            const response = await fetch('api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                contactperson,
                phone,
                email,
                password
            })
        });

        if (response.ok) {

            if (response.status == 211) {
                errMsgDiv.innerHTML = 'Benutzer bereits vorhanden';
                return    
            }
            
            const { record } = await response.json();
            
            document.querySelector('.bbs-form h2').style.display = 'none';
            document.querySelector('.bbs-form p').style.display = 'none';

            const form = document.getElementById('bbs-register-form');

            form.style.text = 'center';

            
            form.innerHTML = 'Willkommen beim Bowling Booking System <br>' +
                              'Die Registrierung war erfogreich für den Benuzer ' +  '<br><center><b>' +  record.username + '</b></center>' +
                              '<br> Es wird jetzt die Login Seite aufgeblendet';

            setTimeout( () => {
                window.location.href = 'index.html?username=' + encodeURIComponent(record.username);
            },5000);

        } else {
                        
            throw new Error(response.statusText);
        }
    } catch (err) {
        console.log('error: ', err);
        errMsgDiv.innerHTML = 'Fehler beim Registrieren ' + err.message ? err.message: 'Unbekannter Fehler';
    }
});