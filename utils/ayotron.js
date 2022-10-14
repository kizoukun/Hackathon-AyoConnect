const axios = require('axios');
const Utils = require('./utils');
let AUTHKEY = {
    "accessToken": "",
    "expired": 0,
}

class Ayotron {
    constructor() {
        this.KEY = process.env.AYOTRON_API_KEY;
        this.SECRET = process.env.AYOTRON_SECRET;
    }
    getToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const params = new URLSearchParams()
                params.append("client_id", this.KEY);
                params.append("client_secret", this.SECRET);
                const dateNow = new Date().getTime();
                if(AUTHKEY.expired > dateNow) {
                    return resolve(AUTHKEY.accessToken);
                }
                const {data} = await axios.post("https://sandbox.api.of.ayoconnect.id/v1/oauth/client_credential/accesstoken?grant_type=client_credentials", params, {
                    headers: {
                        "accept": "*/*",
                        "content-type": "application/x-www-form-urlencoded",
                    }
                });
                AUTHKEY = {
                    "accessToken": data.accessToken,
                    "expired": dateNow + (30*60*1000),
                }
                resolve(data.accessToken)
            } catch (err) {
                reject(err);
            }
        })
    }
    generateWebview(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    "transactionId": Utils.createUID(32),
                    "merchantCode": "HACK10",
                    "phoneNumber": "6285677770010",
                    "email": email,
                    "urlType": "BINDING",
                    "redirectionRequired": "Y",
                    "redirectionDetails": {
                        "successURL": process.env.APP_URL + "/callback/ayotron/bind/{customerId}",
                        "successMethod": "POST",
                        "failureURL": process.env.APP_URL + "/callback/ayotron/{customerId}/fail",
                        "failureMethod": "POST"
                    }
                }
                const AuthKey = await this.getToken();
                const {data} = await axios.post("https://sandbox.api.of.ayoconnect.id/api/v1/directdebit/generate/webview", payload, {
                    headers: {
                        "Authorization": "Bearer " + AuthKey,
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "X-Correlation-ID": Utils.createUID(32),
                    }
                })
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
    getCards(CustomerID) {
        return new Promise(async (resolve, reject) => {
            try {
                const AuthKey = await this.getToken();
                const {data} = await axios.get(`https://sandbox.api.of.ayoconnect.id/api/v1/directdebit/cards?transactionId=${Utils.createUID(32)}&merchantCode=HACK10&customerId=${CustomerID}`, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + AuthKey,
                        "X-Correlation-ID": Utils.createUID(32),
                    }
                })
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
    chargeCards(CustomerID, cardToken, bankCode, price) {
        return new Promise(async (resolve, reject) => {
            try {
                const AuthKey = await this.getToken();
                const payload = {
                    "transactionId": Utils.createUID(32),
                    "customerId": CustomerID,
                    "merchantCode": "HACK10",
                    "cardToken": cardToken,
                    "amount": price + ".00",
                    "currency": "IDR",
                    "remarks": "Remarks Merchant",
                    "otpAllowed": "YES",
                    "bankCode": bankCode
                }
                const correletion = Utils.createUID(32)
                let {data} = await axios.post("https://sandbox.api.of.ayoconnect.id/api/v1/directdebit/charges", payload, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + AuthKey,
                        "X-Correlation-ID": correletion,
                    }
                })
                data['correletion'] = correletion;
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
    chargeCardsVerification(CustomerID, cardToken, chargeToken, bankCode, correletionId, otpCode) {
        return new Promise(async (resolve, reject) => {
            try {
                const AuthKey = await this.getToken();
                const payload = {
                    "transactionId": Utils.createUID(32),
                    "customerId": CustomerID,
                    "merchantCode": "HACK10",
                    "cardToken": cardToken,
                    "chargeToken": chargeToken,
                    "passcode": otpCode,
                    "bankCode": bankCode
                }
                const {data} = await axios.post("https://sandbox.api.of.ayoconnect.id/api/v1/directdebit/charges/verification", payload, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + AuthKey,
                        "X-Correlation-ID": correletionId,
                    }
                })
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
    unbindCards(CustomerId, cardsToken) {
        return new Promise(async (resolve, reject) => {
            try {
                const AuthKey = await this.getToken();
                const {data} = await axios.delete(`https://sandbox.api.of.ayoconnect.id/api/v1/directdebit/cards?transactionId=${Utils.createUID(32)}&customerId=${CustomerId}&merchantCode=HACK10&ayoconnectToken=${cardsToken}`, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + AuthKey,
                        "X-Correlation-ID": Utils.createUID(32),
                    }
                })
                resolve(data);
            } catch (err) {
                reject(err);
            }
        })
    }
}


module.exports = Ayotron;