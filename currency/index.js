//Libraries
const axios = require('axios');
const money = require('money');

//Variables
const RATES_URL = 'https://api.exchangeratesapi.io/latest'; // API that gather the currencies rate 
const BLOCKCHAIN_URL = 'https://blockchain.info/ticker'; //Gather the bitcoin rate
const CURRENCY_BITCOIN = 'BTC';

const isAnyBTC = (from, to) => [from, to].includes(CURRENCY_BITCOIN);

//Fonction asynchrone.
module.exports = async opts => {
  const {amount = 1, from = 'USD', to = CURRENCY_BITCOIN} = opts;
  const promises = [];
  let base = from;

  const anyBTC = isAnyBTC(from, to); // Check if one of the currencies is BTC

  //We use the BlockChain API since we talk about bitcoin
  if (anyBTC) {
    base = from === CURRENCY_BITCOIN ? to : from;
    promises.push(axios(BLOCKCHAIN_URL));
  }
  //We use the other API in the case there is no BTC conversion
  promises.unshift(axios(`${RATES_URL}?base=${base}`));

  try {
    const responses = await Promise.all(promises);
    const [rates] = responses;

    money.base = rates.data.base; //The currency we are changing  
    money.rates = rates.data.rates; //The rates from our money base to all the other currencies
    
    //Object with our conversion informations
    const conversionOpts = {
      from,
      to
    };

    if (anyBTC) { // If bitcoin is converted you had the BTC rate to the list of rates 
      const blockchain = responses.find(response =>
        response.data.hasOwnProperty(base)
      );

      Object.assign(money.rates, {
        'BTC': blockchain.data[base].last
      });
    }

    if (anyBTC) { // Always from BTC to the other currency
      Object.assign(conversionOpts, {
        'from': to,
        'to': from
      });
    }

    return money.convert(amount, conversionOpts); //Conversion of the amount from the "from" currency of the conversionOpts object to the "to" currency of the conversionOpts Object
  } catch (error) {
    throw new Error (
      '💵 Please specify a valid `from` and/or `to` currency value!'
    );
  }
};
