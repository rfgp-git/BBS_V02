import axios from 'axios';

async function generateAccessToken() {
    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
        method: 'post',
        data: 'grant_type=client_credentials',
        auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_SECRET
        }
    });
    //console.log(response.data);
     return response.data.access_token;
}

async function createOrder(invoiceno, fee) {
    const accessToken = await generateAccessToken()
    console.log("PayPalBaseUrl ", process.env.PAYPAL_BASE_URL);
    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        /*
        data: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    items: [
                        {
                            name: 'St. Kunigund Schnaittach Kegelbahn Gebühr: ' + invoiceno,
                            description: 'Gebühren für die Nutzung der Kegelbahn in Schnaittach',
                            quantity: 1,
                            unit_amount: {
                                currency_code: 'EUR',
                                value: fee
                            }
                        }
                    ],

                    amount: {
                        currency_code: 'EUR',
                        value: fee,
                        breakdown: {
                            item_total: {
                                currency_code: 'EUR',
                                value: fee
                            }
                        }
                    }
                }
            ],

            application_context: {
                return_url: process.env.BASE_URL + '/complete-order',
                cancel_url: process.env.BASE_URL + '/cancel-order',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'BBS Rechnung'
            }
        })*/
    });

    return response.data.links.find(link => link.rel === 'approve').href
}

export default { createOrder}