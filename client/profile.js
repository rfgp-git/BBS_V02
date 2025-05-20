window.onload = async () => {
    if (!sessionStorage.getItem('isAuthenticated')) {
        alert('Zugriff verweigert');
        window.location.href = 'index.html';
    } else {

        try {

            const response = await fetch('api/user', {
                method: 'GET',
                headers: {
                    'Contetnt-Type': '/application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
            
                const { user } = await response.json();

                const userInfo = document.getElementById('user-info');

                const username = document.createElement('p');
                username.innerText = 'Benutzername: ' + user.name;
                
                const email = document.createElement('p');
                email.innerText = 'E-Mail: ' + user.email;

                userInfo.appendChild(username);
                userInfo.appendChild(email);

            } else {
                const {msg} = await response.json();
                throw new Error(msg);
            }


        } catch(err) {
            alert('Profile Seite konnte nicht geladen werden ' + err?.message || 'Unbekannter Fehler');
            window.location.href = 'index.html';
        }
    }
}