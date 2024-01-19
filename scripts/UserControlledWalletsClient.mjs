// API测试：https://getman.cn/
// 执行命令：npx hardhat run .\scripts\UserControlledWalletsClient.mjs

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { config as dotenvConfig } from 'dotenv';

// 加载 .env 文件中的环境变量
dotenvConfig();
// 获取 API_KEY 变量的值
const API_KEY = process.env.API_KEY;

// 在脚本中使用 API_KEY
console.log('API_KEY:      ', API_KEY);

//UUID 生成器：https://www.uuidgenerator.net/version4
const USER_ID_1 = 'fa0db9ea-3e8b-4a7c-b5e6-3940fd084c65'; //钱包ID：3a374c59-9d5c-5d6d-9204-537d1d5f9d16，钱包地址：0xc69f06068fae838e1630dd6d893e712965edfb34
const USER_ID_2 = '13f35d4b-d2e5-4b48-935f-6f14628f2e2d'; //钱包ID：e7ed876f-7695-509c-bfce-6be0b595171f，钱包地址：0xadae7fd18e8177eb373bcd6ac2639ad9ddc08f7f
const USER_ID_3 = '4f3a07be-5023-4fb4-a696-4abe12bfb4df'; //钱包ID：NA                                  ，钱包地址：NA
const USER_ID = USER_ID_2;

//Token令牌地址
const MATIC_MUMBAI_USDC_TokenId      = '7adb2b7d-c9cd-5164-b2d4-b73b088274dc';
const MATIC_MUMBAI_USDC_TokenAddress = '0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97';

//区块链
const BLOCKCHAIN = "MATIC-MUMBAI";

/**
 * 函数功能描述
 * @param {类型} 参数名 - 参数描述
 * @returns {类型} 返回值描述
 */

//创建幂等密钥
function generateIdempotencyKey() {
    return uuidv4();
}

//获取应用程序ID
async function get_appid() {

    const url = 'https://api.circle.com/v1/w3s/config/entity';
    const options = {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY}
    };
    
    try {
        console.log('\n', '###start get appid...')

        const response = await fetch(url, options);

        if (response.ok && response.status == 200) { //成功返回200 
            console.log('get appid ok, response.status:', response.status); 
        } else {
            throw new Error('get appid failed, response.status:' + response.status);
        }

        const data = await response.json();
        // console.log(data);
        return data.data.appId

    } catch (error) {
        console.log('get appid error...')
        console.error(error);
    }
    
}

//创建用户
async function create_user() {

    const url = 'https://api.circle.com/v1/w3s/users';
    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY},
        body: JSON.stringify({userId: USER_ID})
    };

    try {
        console.log('\n', '###start create user...')

        const response = await fetch(url, options);

        if (response.ok && (response.status == 201)) { //成功返回201
            console.log('create user ok, response.status:', response.status); 
        } else {
            throw new Error('create user failed, maybe user is already exist, response.status:' + response.status);
        }

        const data = await response.json();
        // console.log(data);

    } catch (error) {
        console.log('create user error...')
        console.error(error);
    }

}

//获取会话令牌，60分钟有效
async function get_session() {

    const url = 'https://api.circle.com/v1/w3s/users/token';
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY},
      body: JSON.stringify({userId: USER_ID})
    };
    
    // 创建幂等密钥
    const idempotencyKey = generateIdempotencyKey();
    // console.log('idempotencyKey:', idempotencyKey); 

    try {
        console.log('\n', '###start get session...')

        const response = await fetch(url, options);
        // console.log(response.ok, response.status)

        if (response.ok && response.status == 200) { //成功返回200 
            console.log('get session ok, response.status:', response.status); 
        } else {
            throw new Error('get session failed, response.status:' + response.status);
        }

        const data = await response.json();
        // console.log(data);
        return { userToken: data.data.userToken, encryptionKey: data.data.encryptionKey , idempotencyKey: idempotencyKey};

    } catch (error) {
        console.log('get session error...')
        console.error(error);
    }
}

//初始化用户
async function init_user(user_token, idempotencyKey) {

    const url = 'https://api.circle.com/v1/w3s/user/initialize';
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type':  'application/json',
            Authorization: 'Bearer ' + API_KEY,
            'X-User-Token':  user_token
        },
        //幂等密钥, 先使用USER_ID
        body: JSON.stringify({
            'idempotencyKey': idempotencyKey,
            'blockchains': [BLOCKCHAIN],
            'accountType': "SCA"
        })
    };

    try {
        console.log('\n', '###start init user...')
        // console.log(options)

        const response = await fetch(url, options);
        // console.log(response.ok, response.status)

        if (response.ok && response.status == 201) { //成功返回201 
            console.log('init user ok, response.status:', response.status); 
        } else {
            throw new Error('init user failed, response.status:' + response.status);
        }

        const data = await response.json();
        // console.log(data);
        return data.data.challengeId;

    } catch (error) {
        console.log('init user error...')
        console.error(error);
    }
}

//检查钱包状态
async function check_wallet_status() {

    const url = 'https://api.circle.com/v1/w3s/wallets?userId=' + USER_ID;
    const options = {
        method: 'GET',
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY}
    };

    try {
        console.log('\n', '###start check wallet status...')
        // console.log(options)

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        if (response.ok && response.status == 200) { //成功返回201 
            console.log('check wallet ok, response.status:', response.status); 
        } else {
            throw new Error('check wallet failed, response.status:' + response.status);
        }

        const data = await response.json();
        console.log(data);
        console.log(data.data.wallets[0]);

        const wallet = data.data.wallets[0]
        return { id: wallet.id, address: wallet.address };

    } catch (error) {
        console.log('check wallet error...')
        console.error(error);
    }

}

//发起交易
async function transfer_token(user_token, idempotencyKey) {

    const url = 'https://api.circle.com/v1/w3s/user/transactions/transfer';
    const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization : 'Bearer ' + API_KEY,
        'X-User-Token': user_token
    },
    body: JSON.stringify({
        idempotencyKey: idempotencyKey,
        amounts: ['1'], //填实际数量，1表示1USDC       
        destinationAddress: '0xc69f06068fae838e1630dd6d893e712965edfb34',
        refId: 'Circle Wallet Demo',
        tokenId: MATIC_MUMBAI_USDC_TokenId,
        walletId: 'e7ed876f-7695-509c-bfce-6be0b595171f',
        userToken: user_token,
        feeLevel: 'HIGH',
    })
    };

    try {
        console.log('\n', '###start transfer token...')
        console.log(options)

        const response = await fetch(url, options);
        console.log(response.ok, response.status)

        // if (response.ok && response.status == 200) { //成功返回201 
        //     console.log('check wallet ok, response.status:', response.status); 
        // } else {
        //     throw new Error('check wallet failed, response.status:' + response.status);
        // }

        const data = await response.json();
        // console.log(data);
        return data.data.challengeId;

    } catch (error) {
        console.log('check wallet error...')
        console.error(error);
    }

}

async function main() {

    // // 获取应用程序ID
    const appid = await get_appid()
    
    // // 创建用户
    // // await create_user()

    // // 获取会话令牌
    const session = await get_session()

    // // 初始化用户
    // const challengeId = await init_user(session.userToken, session.idempotencyKey)

    // console.log('\n', '用户初始化完成，请在APP中设置账户创建钱包：')
    // console.log('AppId:          ', appid)
    console.log('userToken:      ', session.userToken)
    console.log('encryptionKey:  ', session.encryptionKey)
    // console.log('challengeId:    ', challengeId)

    /**
     * 在APP上操作：
     * 0、输入AppId、userToken、encryptionKey、challengeId
     * 1、设置6位PIN码
     * 2、设置恢复问题
     * 3、签署同意声明
     */

    // 检查钱包状态
    // const wallet = await check_wallet_status()
    // console.log('walletId:      ', wallet.id)
    // console.log('walletAddress: ', wallet.address)

    // //发送转账交易
    // const challengeId = await transfer_token(session.userToken, session.idempotencyKey)
    // console.log('\n', '发起转账请求，请在APP中确认授权：')
    // console.log('AppId:          ', appid)
    // console.log('userToken:      ', session.userToken)
    // console.log('encryptionKey:  ', session.encryptionKey)
    // console.log('challengeId:    ', challengeId)

    /**
     * 在APP上操作：
     * 0、输入AppId、userToken、encryptionKey、challengeId
     * 1、输入6位PIN码，确认授权
     */

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

