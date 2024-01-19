# Circle可编程钱包

### 用户控制钱包

交互流程：

1. 获取应用程序ID
2. 创建用户
3. 获取会话令牌，60分钟有效
4. 初始化用户，此步骤需要用户在APP上操作设置PIN码和签署同意声明
5. 检查钱包状态
6. 发起交易，此步骤需要用户在APP上操作确认授权

### 开发者控制钱包

交互流程：
1. 创建实体秘密
2. 创建实体公钥
3. 使用公钥加密实体秘密
4. 创建幂等密钥
5. 创建钱包集
6. 创建钱包
7. 转账交易

详见代码。

### 参考文档

[circle 可编程钱包控制台](https://console.circle.com/home)

[circle 可编程钱包官方文档](https://developers.circle.com/w3s/docs/circle-programmable-wallets-an-overview)