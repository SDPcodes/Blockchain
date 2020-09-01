//This library generates public and pvt keys as well as generate signatures and provide features to verify them.
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); //This is the algorithm used in bitcoin wallet

//These two keys use to sign our transactions and when checking balance of our wallet
const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privetKey = key.getPrivate('hex');

console.log('Public Key : ' + publicKey);
console.log('Private Key : ' + privetKey);

// Public Key : 049ee7e839706d388dd8ca9f182d2da0359eb843ddd668bffb12b271208da9e0d3a1ead5ab7449d3e362767d91024f614f7702b74d064fd31e0550ab234ab5d086
// Private Key : 482a9b44cb7ad1c49e8ff4660f8bd4ec34fc57b578263551df44b68d63237ba0
