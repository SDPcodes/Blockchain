const SHA256 = require('crypto-js/sha256');
const { threadId } = require('worker_threads');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('482a9b44cb7ad1c49e8ff4660f8bd4ec34fc57b578263551df44b68d63237ba0');
const myWalletAddress = myKey.getPublic('hex');

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    //Generate hash of the transaction to sign with our private key
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey){
        if (signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets');
        }
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');

    }

    isValid(){
        if (this.fromAddress === null){return true};
        if (!this.signature || this.signature.length === 0){
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

//When creating a block it takes parameters and calculate hash by using them. 
class Block{
    constructor (timestamp, data, pervioushash = ''){
        this.timestamp = timestamp;
        this.data = data;
        this.pervioushash = pervioushash; 
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash(){
        return SHA256(this.pervioushash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty){
        while (this.hash.substring(0,difficulty) !== Array(difficulty+1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block Mined: " + this.hash);
    }

    hasValidTransactions(){
        for (const tx of this.data){
            if (!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}

class BlockChain{
    constructor () {
        this.chain = [this.createGensisBlock()];
        this.difficulty = 2;  //Increases the value and increase difficulty 
        this.pendingTransactions = [];
        this.miningReward = 100; //coins get after mining successfully 
    }

    createGensisBlock (){
        return new Block ("01/01/2020", "Genesis Block Data", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length-1]; 
    }

    addBlock(newBlock){
        newBlock.pervioushash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        // newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
    }

    minePendingTransactions(miningRewardAddress){ //Miner call this function to collect coins after mining successfully.
        let block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);
        console.log('Block Successfully Mined..!');
        this.chain.push(block);

        this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningReward)];
    }

    createTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error("Transaction must include from and to address");
        }
        if(!transaction.isValid){
            throw new Error("Cannot add invalid transaction to the chain");
        }
        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance =0;

        for (const block of this.chain){
            for (const trans of block.data){
                if (trans.fromAddress === address){
                    balance -= trans.amount;
                }
                if (trans.toAddress === address){
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid(){
        for (let i = 1; i< this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if (!currentBlock.hasValidTransactions){return false}
            if (currentBlock.hash !== currentBlock.calculateHash()){return false}
            if (previousBlock.hash !== currentBlock.pervioushash){return false}
        }

        return true;
    }
}

let instanceOfBlockchain = new BlockChain();

//----------------------------------------POW----------------------------------

// console.log('Mining Block 1.....');
// instanceOfBlockchain.addBlock(new Block("02/02/2020", {amount: 10})); 

// console.log('Mining Block 2.....');
// instanceOfBlockchain.addBlock(new Block("03/03/2020", {amount: 20})); 

// //Checking validity of the blockchan
// console.log("Is my blockchain valid ? " + instanceOfBlockchain.isChainValid());

// //Check the validity of the chain after doing changes
// instanceOfBlockchain.chain[1].data = {amount: 100};
// console.log("Is my blockchain valid ? " + instanceOfBlockchain.isChainValid());

// // print the blockchain
// console.log(JSON.stringify(instanceOfBlockchain, null, 4));

//-------------------------------------------Transaction----------------------------------------
// //Create new transactions and add them to the pending transaction array
// instanceOfBlockchain.createTransaction(new Transaction('address1','address2', 100));
// instanceOfBlockchain.createTransaction(new Transaction('address2','address1', 50));

// //Ask miner to mine those transactions and add them to the blockchain
// instanceOfBlockchain.minePendingTransactions('miner_address');
// //Get the balance after mining 
// console.log('\n Miner balance: ' + instanceOfBlockchain.getBalanceOfAddress('miner_address'));

// //Ask miner to mine those transactions and add them to the blockchain
// instanceOfBlockchain.minePendingTransactions('miner_address');
// //Get the balance after mining 
// console.log('\n Miner balance nex time: ' + instanceOfBlockchain.getBalanceOfAddress('miner_address'));


// console.log('\n Address1 balance: ' + instanceOfBlockchain.getBalanceOfAddress('address1'));
// console.log('\n Address2 balance: ' + instanceOfBlockchain.getBalanceOfAddress('address2'));

//----------------------------Signing Transaction ---------------------------------------------------
const tx1 = new Transaction(myWalletAddress, 'ReceiverPublicAddress', 10);
tx1.signTransaction(myKey);
instanceOfBlockchain.createTransaction(tx1);

//Ask miner to mine those transactions and add them to the blockchain
instanceOfBlockchain.minePendingTransactions(myWalletAddress);
instanceOfBlockchain.minePendingTransactions(myWalletAddress);
//Get the balance after mining 
console.log('\n Miner balance: ' + instanceOfBlockchain.getBalanceOfAddress(myWalletAddress));

//Trying to tamper the data
instanceOfBlockchain.chain[1].data[0].amount = 2 ;
console.log('Is chain valid : ' + instanceOfBlockchain.isChainValid());