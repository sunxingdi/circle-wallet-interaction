//执行命令：npx hardhat run .\scripts\DeveloperControlledWalletsClient.mjs

import crypto from 'crypto';
import fetch from 'node-fetch';
import forge from 'node-forge';
import { v4 as uuidv4 } from 'uuid';
import { config as dotenvConfig } from 'dotenv';

// 加载 .env 文件中的环境变量
dotenvConfig();
// 获取 API_KEY 变量的值
const API_KEY = process.env.API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;

// 在脚本中使用 API_KEY
console.log('API_KEY:      ', API_KEY);
console.log('ENTITY_SECRET:', ENTITY_SECRET);

//区块链
const BLOCKCHAIN = "MATIC-MUMBAI";

//Token令牌地址
const MATIC_MUMBAI_USDC_TokenId      = '7adb2b7d-c9cd-5164-b2d4-b73b088274dc';

//创建幂等密钥
function generateIdempotencyKey() {
    return uuidv4();
}

//生成实体秘密
async function create_entity_secret() {

    console.log('\n', '###start create entity secret...')
    const secret = crypto.randomBytes(32).toString('hex')
    // console.log(secret)
    return secret;
}

//获取实体公钥
async function create_public_key() {

    const url = 'https://api.circle.com/v1/w3s/config/entity/publicKey';
    const options = {
      method: 'GET',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY}
    };
    
    try {
        console.log('\n', '###start create public key...')

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        // if (response.ok && response.status == 200) { //成功返回200 
        //     console.log('get appid ok, response.status:', response.status); 
        // } else {
        //     throw new Error('get appid failed, response.status:' + response.status);
        // }

        const data = await response.json();
        // console.log(data);
        return data.data.publicKey

    } catch (error) {
        console.log('get appid error...')
        console.error(error);
    }  

}

//使用公钥加密实体秘密
async function encrypt_entity_secret(entity_secret, public_key) {

    console.log('\n', '###start encrypt entity secret...')
    
    const entitySecret = forge.util.hexToBytes(entity_secret)
    const publicKey = forge.pki.publicKeyFromPem(public_key)
    const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    })
    
    const entitySecretCipherText = forge.util.encode64(encryptedData)
    // console.log(entitySecretCipherText)
    return entitySecretCipherText
    
}

//创建钱包集
async function create_wallet_set(idempotencyKey, entitySecretCipherText, name) {

    const url = 'https://api.circle.com/v1/w3s/developer/walletSets';
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY},
      body: JSON.stringify({
        idempotencyKey: idempotencyKey,
        entitySecretCipherText: entitySecretCipherText,
        name: name
      })
    };
    
    try {
        console.log('\n', '###start create wallet set...')

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        if (response.ok && response.status == 201) { //成功返回201 
            console.log('create wallet set ok, response.status:', response.status); 
        } else {
            throw new Error('create wallet set failed, response.status:' + response.status);
        }

        const data = await response.json();
        console.log(data);
        return data.data.walletSet.id

    } catch (error) {
        console.log('create wallet set error...')
        console.error(error);
    }    
}

//创建钱包
async function create_wallet(idempotencyKey, entitySecretCipherText, blockchains, count, walletSetId) { 

    const url = 'https://api.circle.com/v1/w3s/developer/wallets';
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY},
      body: JSON.stringify({
        idempotencyKey: idempotencyKey,
        entitySecretCipherText: entitySecretCipherText,
        blockchains: blockchains,
        count: count,
        walletSetId: walletSetId,
        accountType: "SCA", //默认EOA
      })
    };
    
    try {
        console.log('\n', '###start create wallet...')

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        if (response.ok && response.status == 201) { //成功返回201 
            console.log('create wallet ok, response.status:', response.status); 
        } else {
            throw new Error('create wallet failed, response.status:' + response.status);
        }

        const data = await response.json();
        console.log(data);
        return data.data.wallets

    } catch (error) {
        console.log('create wallet error...')
        console.error(error);
    }   
}

//创建钱包
async function transfer_token(idempotencyKey, entitySecretCipherText, destinationAddress, tokenId, walletId) {

    const url = 'https://api.circle.com/v1/w3s/developer/transactions/transfer';
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
        body: JSON.stringify({
            idempotencyKey: idempotencyKey,
            entitySecretCipherText: entitySecretCipherText,
            amounts: ['1'],
            destinationAddress: destinationAddress,
            feeLevel: 'HIGH',
            tokenId: tokenId,
            walletId: walletId
        })
    };

    try {
        console.log('\n', '###start transfer token...')

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        if (response.ok && response.status == 201) { //成功返回201 
            console.log('create transfer token ok, response.status:', response.status); 
        } else {
            throw new Error('create transfer token failed, response.status:' + response.status);
        }

        const data = await response.json();
        console.log(data);
        // return data.data.wallets

    } catch (error) {
        console.log('create transfer token error...')
        console.error(error);
    }   
}

async function main() {
    
    //创建实体秘密
    // const entity_secret = await create_entity_secret()
    const entity_secret = ENTITY_SECRET
    // console.log('entity_secret:', entity_secret) 

    //创建实体公钥
    const public_key = await create_public_key()
    console.log(public_key)

    //使用公钥加密实体秘密
    const entitySecretCipherText = await encrypt_entity_secret(entity_secret, public_key)
    console.log('entitySecretCipherText:', entitySecretCipherText)

    //创建幂等密钥
    const idempotencyKey = generateIdempotencyKey();
    console.log('idempotencyKey:', idempotencyKey); 
    
    // //创建钱包集
    // const walletSetId = await create_wallet_set(idempotencyKey, entitySecretCipherText, 'demo_wallet_set')
    // console.log('walletSetId:', walletSetId); 

    // //创建钱包
    // const wallets = await create_wallet(idempotencyKey, entitySecretCipherText, [BLOCKCHAIN], 1, walletSetId)
    // console.log('wallets:', wallets); 

    // 转账交易
    // const destinationAddress = "0xc8fe533adff439798ab3a7d88601c070b680365a";
    // const tokenId = MATIC_MUMBAI_USDC_TokenId;
    // const walletId = "e7fbbacd-4dbd-5fcc-a52d-2c9184bbe636";
    // await transfer_token(idempotencyKey, entitySecretCipherText, destinationAddress, tokenId, walletId)

}

// 运行 main 函数
main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


/**
 * 钱包ID_1：e7fbbacd-4dbd-5fcc-a52d-2c9184bbe636   11 USDC
 * 钱包ID_2：19eb6ba8-2c63-5c5d-8950-966e12933764    9 USDC
 * 钱包ID_3：527157d9-07a2-5e24-bb6f-ce3124d391fb
 * 钱包ID_4：90b7dc46-7050-5b28-b27e-fd951db00356
 */