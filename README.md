# LINE WORKS Bot APIをひと通り触ってみる（node.js）

LINE WORKS Bot API をnode.jsでひと通り触ってみるプログラムです。

## Qiitaの記事
 [#1](https://qiita.com/shotamaco/items/bd510729adc0497d7d0b)


# Table of Contents
  * [Requirements](#requirements)
  * [Installation](#installation)
  * [Usage](#usage)
  * [Link](#Link)
  * [License](#license)
  
# Requirements
  * [Node.js](https://nodejs.org/) 0.10+
  * [npm](https://www.npmjs.com/)
  * [VS Code](https://code.visualstudio.com/)
  * [ngrok](https://ngrok.com/) (ローカルデバッグで使用)
  * [LINE WORKS account](https://line.worksmobile.com/jp/)
  * [LINE WORKS Admin](https://contact.worksmobile.com/v2/admin/member/management)
  * [LINE WORKS Developer Console](https://developers.worksmobile.com/jp/console/openapi/main)
  * [LINE WORKS mobile app](https://line.worksmobile.com/jp/download/)
  
# Installation
```
npm install
```

# Usage
1. http 3000 で ngrok 起動！
```
ngrok http 3000
```

 2. LINE WORKS の Developer Console でBotサーバーが LINE WORKS と通信するために必要な接続情報の発行とBotの登録を行う
 
　　↓こちらの記事を参考に作業していただければと思います。
 
　　[LINE WORKSで初めてのBot開発！(前編)](https://qiita.com/tokotan/items/f615f4a62219d655436f) の「[Developer ConsoleでAPIを使うための設定とBotを登録する](https://qiita.com/tokotan/items/f615f4a62219d655436f#developer-console%E3%81%A7api%E3%82%92%E4%BD%BF%E3%81%86%E3%81%9F%E3%82%81%E3%81%AE%E8%A8%AD%E5%AE%9A%E3%81%A8bot%E3%82%92%E7%99%BB%E9%8C%B2%E3%81%99%E3%82%8B)」
 
　　※Bot登録の際に指定する Callback URL は、[ngrok](https://ngrok.com/)を利用して取得した Forwarding の https の URLです。

3. LINE WORKS の管理画面で、Developer Console で登録したBotをメンバーが利用できる様に設定する

　　↓こちらの記事を参考に作業していただければと思います。
  
　　[LINE WORKSで初めてのBot開発！(後編)](https://qiita.com/tokotan/items/976d35ca56132e0bb5c1) の「[Botを公開し利用する](https://qiita.com/tokotan/items/976d35ca56132e0bb5c1#bot%E3%82%92%E5%85%AC%E9%96%8B%E3%81%97%E5%88%A9%E7%94%A8%E3%81%99%E3%82%8B)」

4. 環境変数 (.env)の修正する

　　2で発行した接続情報を設定する。
  
```
API_ID="API ID"
CONSUMER_KEY="Consumer key"
SERVER_ID="Server ID"
PRIVATE_KEY="認証キー"
BOT_NO="Bot No"
```

5. VS Code debug start

6. LINE WORKS mobile app で、3で登録したBotとトークを行います。

# Link
  * [LINE WORKS Developers](https://developers.worksmobile.com/)
  * [LINE WORKS ガイド（全般）](https://guide.worksmobile.com/)
  * [LINE WORKS ガイド（管理者画面）](https://guide.worksmobile.com/admin/)
  * [LINE WORKS コミュニティ](https://community.worksmobile.com/)
  * [LINE WORKS ヘルプセンター](https://help.worksmobile.com/)
  * [LINE WORKS Blog](https://line.worksmobile.com/jp/blog/)
  * [さわってわかったLINE WORKS](https://ascii.jp/elem/000/001/955/1955720/)

# License
Apache 2.0
