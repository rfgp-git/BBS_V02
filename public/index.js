window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (!urlParams) return;

    const username = urlParams.get('username');

    if (username) {
        const usernameInput = document.getElementById('username');
        usernameInput.value = username;
    }
}

document.getElementById('login-button').addEventListener('click', async event => {

        event.preventDefault();
        localStorage.clear();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errmsgDiv = document.getElementById('error-message');

        if (!username || !password) {
            errmsgDiv.innerHTML='Alle Felder müssen ausgefüllt sein';
            return;
        }

        try {
            const response = await fetch('api/login',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
                credentials: 'include'
            });

            const { msg, redirectTo } = await response.json(); 
            
            if (response.ok) {
                sessionStorage.setItem('isAuthenticated', true);
                // get User details
                try {
                    const response = await fetch('api/user', {
                        method: 'GET',
                        headers: {
                            'Contetnt-Type': '/application/json'
                        },
                        credentials: 'include'
                    });

                    if (response.ok) {
                    
                        User = await response.json();
                        // Convert the array to a JSON string
                        let string = JSON.stringify(User);
                        // Store the JSON string in local storage
                        localStorage.setItem("ActiveUser", string);
                        window.location.href = redirectTo + '.html';
                    } else {
                        const {msg} = await response.json();
                        throw new Error(msg);
                    }

                } catch(err) {
                    alert('Benutzername konnte nicht ermittelt werden ' + err?.message || 'Unbekannter Fehler');
                }
                
            } else {
                errmsgDiv.innerHTML='login fehlgeschlagen ' + msg ? msg : 'Unbekannter Fehler';
            }
        } catch(err) {
            errmsgDiv.innerHTML=err?.message || 'Login fehlgeschlagen';
        }
});