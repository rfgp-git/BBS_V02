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
                window.location.href = redirectTo + '.html';
            } else {
                errmsgDiv.innerHTML='login fehlgeschlagen ' + msg ? msg : 'Unbekannter Fehler';
            }

        } catch(err) {
            errmsgDiv.innerHTML=err?.message || 'Login fehlgeschlagen';
        }





});