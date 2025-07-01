export const UserValidationSchema = {
    username: {
        isLength: {
            options: {
                min: 3,
                max: 32
            },
            errorMessage: 'Der Benutzername muss mindestens 3 Zeichen und darf maximal 32 Zeichen lang sein'
        },
        notEmpty: {
            errorMessage: 'Der Benutzername darf nicht leer sein'
        },
        isString: {
            errorMessage: 'Der Benutzername muss eine Zeichenfolge sein'
        }
    },
    contactperson: {
        notEmpty: {
            errorMessage: 'Die Kontakt-Person darf nicht leer sein'
        },
        isString: {
            errorMessage: 'Die Kontakt-Person muss eine Zeichenfolge sein'
        }
    },
    phone: {
        notEmpty: {
            errorMessage: 'Die Telefon Nr. darf nicht leer sein'
        },
        isString: {
            errorMessage: 'Die Telefon Nr. muss eine Zeichenfolge sein'
        }
    },
    email: {
        isEmail: {
            errorMessage: 'Bitte eine gültige E-Mail Adresse eingeben'
        },
        notEmpty: {
            errorMessage: 'Die E-Mail Adresse darf nicht leer sein'
        },
        isString: {
            errorMessage: 'Die E-Mail Adresse muss eine Zeichenfolge sein'
        }
    },
    password: {
        isLength: {
            options: {
                min: 8,
                max: 32
            },
            errorMessage: 'Das Passwort muss mindestens 8 Zeichen und darf maximal 32 Zeichen lang sein'
        },

        matches: {
            options: [/[a-z]/],
            options: [/[A-Z]/],
            options: [/^\d$/],
            options: [/[!@#$%^&*(),.?":{}|<>]/],
            errorMessage: 'Das Passwort muss mindestens 1 Klein- Grossbuchstaben, 1 Zahl und ein Sonderzeichen haben'
        },
        notEmpty: {
            errorMessage: 'Das Passwort darf nicht leer sein'
        },
        isString: {
            errorMessage: 'Das Passwort muss eine Zeichenfolge sein'
        }

    }
};