const request = require('request');

/**
 * コールバックタイプ
 */
const CALL_BACK_TYPE = {
  /**
   * メンバーからのメッセージ
   */
  message : 'message',
  /**
   * Bot が複数人トークルームに招待された
   * このイベントがコールされるタイミング
   *  ・API を使って Bot がトークルームを生成した
   *  ・API を使って Bot がトークルームを生成した
   *  ・メンバーが Bot を含むトークルームを作成した
   *  ・Bot が複数人のトークルームに招待された
   * ※メンバー１人と Bot のトークルームに他のメンバーを招待したらjoinがコールされる（最初の１回だけ）
   *  招待したメンバーを退会させ、再度他のメンバーを招待するとjoinedがコールされるこれ仕様？
   *  たぶん、メンバー１人と Botの場合、トークルームIDが払い出されてないことが原因だろう。。。
   */
  join : 'join',
  /**
   * Bot が複数人トークルームから退室した
   * このイベントがコールされるタイミング
   *  ・API を使って Bot を退室させた
   *  ・メンバーが Bot をトークルームから退室させた
   *  ・何らかの理由で複数人のトークルームが解散した
   */
  leave : 'leave',
  /**
   * メンバーが Bot のいるトークルームに参加した
   * このイベントがコールされるタイミング
   *  ・Bot がトークルームを生成した
   *  ・Bot が他のメンバーをトークルームに招待した
   *  ・トークルームにいるメンバーが他のメンバーを招待した
   */
  joined : 'joined',
  /**
   * メンバーが Bot のいるトークルームから退室した
   * このイベントがコールされるタイミング
   *  ・Bot が属するトークルームでメンバーが自ら退室した、もしくは退室させられた
   *  ・何らかの理由でトークルームが解散した
   */
  left : 'left',
  /**
   * postback タイプのメッセージ
   * このイベントがコールされるタイミング
   *  ・メッセージ送信(Carousel)
   *  ・メッセージ送信(Image Carousel)
   *  ・トークリッチメニュー
   */
  postback : 'postback',
};

/**
 * コールバックコンテンツタイプ
 */
const CALL_BACK_MESSAGE_CONTENT_TYPE = {
  /**
   * テキスト
   */
  text : 'text',
  /**
   * 場所
   */
  location : 'location',
  /**
   * スタンプ
   */
  sticker : 'sticker',
  /**
   * 画像
   */
  image : 'image'
};

/**
 * メッセージコンテンツタイプ
 */
const MESSAGE_CONTENT_TYPE = {
  /**
   * テキスト
   */
  text : 'text',
  /**
   * 画像
   */
  image : 'image',
  /**
   * リンク
   */
  link : 'link',
  /**
   * スタンプ
   */
  sticker : 'sticker',
  /**
   * ボタンテンプレート
   */
  buttonTemplate : 'button_template',
  /**
   * リストテンプレート
   */
  listTemplate : 'list_template',
  /**
   * カルーセル
   */
  carousel : 'carousel',
  /**
   * 画像カルーセル
   */
  imageCarousel : 'image_carousel'
};

/**
 * BotMessageServiceクラス
 */
module.exports = class BotMessageService {

  /**
   * BotMessageServiceを初期化します。
   * @param {string} serverToken Serverトークン
   */
  constructor (serverToken) {
    this._serverToken = serverToken;
    this.imageIndex = 0;
  }

  /**
   * LINE WORKS にBotメッセージを送信します。
   * @param {object} callbackEvent リクエストのコールバックイベント
   */
  async send(callbackEvent) {
    let res = this._getResponse(callbackEvent);
    if (!res) return;
    return new Promise((resolve, reject) => {
      // LINE WORKS にメッセージを送信するリクエスト
      request.post(this._createMessage(res), (error, response, body) => {
          if (error) {
            console.log('BotService.send error');
            console.log(error);
          }
          console.log(body);
          // 揉み消してます！
          resolve();
      });
    });
  }

  /**
   * LINE WORKS に送信するBotメッセージを作成して返します。
   * @param {object} res レスポンスデータ
   */
  _createMessage(res) {
    return {
      url: `https://apis.worksmobile.com/r/${process.env.API_ID}/message/v1/bot/${process.env.BOT_NO}/message/push`,
      //url: `https://apis.worksmobile.com/${process.env.API_ID}/message/sendMessage/v2`,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        consumerKey: process.env.CONSUMER_KEY,
        Authorization: `Bearer ${this._serverToken}`
      },
      json: res
    };
  }

  /**
   * メンバーIDを連結して返します。
   * @param {Array} memberList メンバーリスト
   * @return {string} メンバーIDリスト文字列
   */
  _buildMember(memberList) {
    let result = '';
    if (!memberList) return result;
    memberList.forEach(m => {
      if (result.length > 0)　result += ',';
      result += m;
    });
    return result;
  }
  
  /**
   * Bot実装部
   * @param {object} callbackEvent リクエストのコールバックイベント
   * @return {string} レスポンスメッセージ
   */
  _getResponse(callbackEvent) {
    console.log(callbackEvent);

    let res = {};

    if (callbackEvent.source.roomId) {
      // 受信したデータにトークルームIDがある場合は、送信先にも同じトークルームIDを指定します。
      res.roomId = callbackEvent.source.roomId;
    } else {
      // トークルームIDがない場合はBotとユーザーとの1:1のチャットです。
      res.accountId = callbackEvent.source.accountId;
    }

    switch (callbackEvent.type) {
      case CALL_BACK_TYPE.message:

        switch (callbackEvent.content.type) {
          case CALL_BACK_MESSAGE_CONTENT_TYPE.text:
            if (callbackEvent.content.postback == 'start') {
              // メンバーと Bot との初回トークを開始する画面で「利用開始」を押すと、自動的に「利用開始」というメッセージがコールされる
              console.log(`start`);
              res.content = { type: MESSAGE_CONTENT_TYPE.text, text: 'ト〜クルームに〜〜。ボトやまが〜くる〜！\n下記を入力するとボトやまが特別な応答をします（大文字小文字を区別しません）。\n・b:button template\n・l:List template\n・c:carousel\n・i:image carousel\n・q:quick reply' };
              return res;
            }

            let content = this._getButtonTemplateContent(callbackEvent.content.postback, callbackEvent.content.text)
              || this._getListTemplateContent(callbackEvent.content.postback, callbackEvent.content.text)
              || this._getCarouselContent(callbackEvent.content.postback, callbackEvent.content.text)
              || this._getImageCarouselContent(callbackEvent.content.postback, callbackEvent.content.text)
              || this._getQuickReplyContent(callbackEvent.content.postback, callbackEvent.content.text);
            if (content) {
              res.content = content;
            } else {
              console.log(CALL_BACK_TYPE.message);
              res.content = { type: MESSAGE_CONTENT_TYPE.text, text: `ですよね〜〜〜。\n（受信データ：${callbackEvent.content.text}）` };
            }
            break;
    
          case CALL_BACK_MESSAGE_CONTENT_TYPE.location:
            // 場所のコールバックは場所データをテキストで返す
            res.content = { type: MESSAGE_CONTENT_TYPE.text, text: `住所：${callbackEvent.content.address}\n緯度：${callbackEvent.content.latitude}\n経度：${callbackEvent.content.longitude}` };
            break;
    
          case CALL_BACK_MESSAGE_CONTENT_TYPE.sticker:
            // スタンプのコールバックはおうむ返し（同じスタンプを返す）
            // ※使えないスタンプがあるようです（LINE WORKSぽいスタンプは使えない。。。）
            res.content = { type: MESSAGE_CONTENT_TYPE.sticker, packageId: callbackEvent.content.packageId, stickerId: callbackEvent.content.stickerId };
            break;
    
          case CALL_BACK_MESSAGE_CONTENT_TYPE.image:
            // 画像のコールバックはおうむ返し（同じ画像を返す）
            res.content = { type: MESSAGE_CONTENT_TYPE.image, resourceId: callbackEvent.content.resourceId };
            break;
          
          default:
            console.log('知らないcontent.typeですね。。。');
            return null;
        }
        break;

      case CALL_BACK_TYPE.join:
        console.log(CALL_BACK_TYPE.join);
        res.content = { type: MESSAGE_CONTENT_TYPE.text, text: 'うぃーん!' };
        break;

      case CALL_BACK_TYPE.leave:
        console.log(CALL_BACK_TYPE.leave);
        break;

      case CALL_BACK_TYPE.joined: {
        console.log(CALL_BACK_TYPE.joined);
        res.content = { type: MESSAGE_CONTENT_TYPE.text, text: `${this._buildMember(callbackEvent.memberList)} いらっしゃいませ〜そのせつは〜` };
        break;
      }

      case CALL_BACK_TYPE.left: {
        console.log(CALL_BACK_TYPE.left);
        res.content = { type: MESSAGE_CONTENT_TYPE.text, text: `${this._buildMember(callbackEvent.memberList)} そうなります？` };
        break;
      }

      case CALL_BACK_TYPE.postback:
        // QuickReply, Carousel, ImageCarouselからのPostback（このコールバック後、CALL_BACK_TYPE.messageのコールバックがコールされる）
        console.log(CALL_BACK_TYPE.postback);
        let content = this._getButtonTemplateContent(callbackEvent.data) 
        || this._getListTemplateContent(callbackEvent.data)
        || this._getCarouselContent(callbackEvent.data)
        || this._getImageCarouselContent(callbackEvent.data)
        || this._getQuickReplyContent(callbackEvent.data);
        if (content) res.content = content;
        break;

      default:
        console.log('知らないコールバックですね。。。');
        return null;
    }

    return res;
  }
  
  /**
   * Quick reply コンテンツを返します。
   * @param {Array} conditions 条件
   * @return {object} コンテンツ
   */
  _getQuickReplyContent(...conditions) {
    if (!conditions.some(condition => condition && condition.toUpperCase() === 'Q')) return;
    return { 
      type: MESSAGE_CONTENT_TYPE.text, 
      text: 'QuickReply からの〜〜〜。',
      quickReply: this._getQuickReplyItems()
    };
  }

  /**
   * Quick reply アイテムリストを返します。
   * @return {Array} アイテムリスト
   */
  _getQuickReplyItems() {
    return {
      items: [
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/giraffe01.png`,
          action: {
            type: 'postback',
            label: 'ButtonTemp',
            data: 'button_template',
            displayText: 'button_template ください'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/panda01.png`,
          action: {
            type: 'postback',
            label: 'ListTemp',
            data: 'list_template',
            displayText: 'list_template ください'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/giraffe02.png`,
          action: {
            type: 'postback',
            label: 'Carousel',
            data: 'carousel',
            displayText: 'carousel ください'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/panda02.png`,
          action: {
            type: 'postback',
            label: 'ImageCarousel',
            data: 'image_carousel',
            displayText: 'image_carousel ください'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/sushi.png`,
          action: {
            type: 'postback',
            label: 'QuickReply',
            data: 'q',
            displayText: 'QuickReply ください'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/sushi.png`,
          action: {
            type: 'message',
            label: 'すし',
            text: 'すし'
          }
        },
        {
          imageUrl: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
          action: {
            type: 'uri',
            label: 'LINE WORKS',
            uri: 'https://line.worksmobile.com/jp/'
          }
        },
        {
          action: {
            type: 'camera',
            label: 'カメラ'
          }
        },
        {
          action: {
            type: 'cameraRoll',
            label: 'カメラロール'
          }
        },
        {
          action: {
            type: 'location',
            label: '場所'
          }
        }
      ]
    }
  }

  /**
   * Button template コンテンツを返します。
   * @param {Array} conditions 条件
   * @return {object} コンテンツ
   */
  _getButtonTemplateContent(...conditions) {
    if (!conditions.some(condition => condition && (condition.toUpperCase() === 'B' || condition === MESSAGE_CONTENT_TYPE.buttonTemplate))) return;
    return { 
      type: MESSAGE_CONTENT_TYPE.buttonTemplate, 
      contentText: 'ButtonTemplate からの〜〜〜。',
      actions: this._getButtonActions()
    };
  }

  /**
   * Buttonアクションリストを返します。
   * @return {Array} アクションリスト
   */
  _getButtonActions() {
    return [
      // button_templateのactionでは typeはmessageとuriしか使えない。つまり postback、camera、cameraRoll、locationは使えない
      {
        type: 'message',
        label: 'Message lable',
        text: 'Message text'
      },
      {
        type: 'message',
        label: 'Button postback',
        text: 'button_template ください',
        postback: 'button_template' 
      },
      {
        type: 'message',
        label: 'List postback',
        text: 'list_template ください',
        postback: 'list_template'
      },
      {
        type: 'message',
        label: 'Carousel postback',
        text: 'carousel ください',
        postback: 'carousel'
      },
      {
        type: 'message',
        label: 'Image carousel pb',
        text: 'image_carousel ください',
        postback: 'image_carousel'
      },
      {
        type: 'message',
        label: 'QuickReply postback',
        text: 'QuickReply ください',
        postback: 'q'
      },
      {
        type: 'uri',
        label: 'LINE WORKS',
        uri: 'https://line.worksmobile.com/jp/'
      }
    ];
  }

  /**
   * List template コンテンツを返します。
   * @param {Array} conditions 条件
   * @return {object} コンテンツ
   */
  _getListTemplateContent(...conditions) {
    if (!conditions.some(condition => condition && (condition.toUpperCase() === 'L' || condition === MESSAGE_CONTENT_TYPE.listTemplate))) return;
    return { 
      type: MESSAGE_CONTENT_TYPE.listTemplate, 
      coverData: {
        backgroundImage: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
        //backgroundResourceId: '',
        title: 'ListTemplate からの〜〜〜。(title)',
        subtitle: 'サブタイトル',
      },
      // 最大4つの要素を指定可能
      elements: this._getListElements(),
      // 最大2*2の配列でアクションを指定可能
      actions: this._getListActions()
    };
  }

  /**
   * List要素リストを返します。
   * @return {Array} 要素リスト
   */
  _getListElements() {
    // list_template.elementsのactionでは typeはmessageとuriしか使えない。つまり postback、camera、cameraRoll、locationは使えない
    return [
      {
        title: 'List message title',
        subtitle: 'List message subtitle',
        image: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
        //resourceId: '',
        action: {
          type: 'message',
          label: 'Message',
          text: 'Message text'
        }
      },
      {
        title: 'Button postback title',
        subtitle: 'Button postback subtitle',
        image: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
        //resourceId: '',
        action: {
          type: 'message',
          label: 'Button',
          text: 'button_template ください',
          postback: 'button_template'
        }
      },
      {
        title: 'List postback title',
        subtitle: 'List postback subtitle',
        image: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
        //resourceId: '',
        action: {
          type: 'message',
          label: 'List',
          text: 'list_template ください',
          postback: 'list_template'
        }
      },
      {
        title: 'List uri title',
        subtitle: 'List uri subtitle',
        image: `${process.env.IMAGE_FILE_HOST}/images/security.png`,
        //resourceId: '',
        action: {
          type: 'uri',
          label: 'LINE WORKS',
          uri: 'https://line.worksmobile.com/jp/'
        }
      }
    ];
  }

  /**
   * Listアクションリストを返します。
   * @return {Array} アクションリスト
   */
  _getListActions() {
    // list_template.actionsのactionでは typeはmessageとuriしか使えない。つまり postback、camera、cameraRoll、locationは使えない
    return [
      [
        {
          type: 'message',
          label: 'Carousel postback',
          text: 'carousel ください',
          postback: 'carousel'
        },
        {
          type: 'message',
          label: 'Image Car postback',
          text: 'image_carousel ください',
          postback: 'image_carousel'
        }
      ],
      [
        {
          type: 'message',
          label: 'QuickReply',
          text: 'QuickReply ください',
          postback: 'q'
        },
        {
          type: 'message',
          label: 'No',
          text: 'No'
        }
      ]
    ];
  }

  /**
   * Carousel コンテンツを返します。
   * @param {Array} conditions 条件
   * @return {object} コンテンツ
   */
  _getCarouselContent(...conditions) {
    if (!conditions.some(condition => condition && (condition.toUpperCase() === 'C' || condition === MESSAGE_CONTENT_TYPE.carousel))) return;
    return { 
      type: MESSAGE_CONTENT_TYPE.carousel,
      //imageAspectRatio: '',
      //imageSize: '',
      columns: this._getCarouselColumns()
    };
  }

  /**
   * Carousel カラムリストを返します。
   * @return {Array} カラムリスト
   */
  _getCarouselColumns() {
    // carousel.columnsのactionでは typeはmessageとuri、postbackしか使えない。つまり camera、cameraRoll、locationは使えない
    // carouselは、postbackをつかえる！！！！
    return [
      {
        thumbnailImageUrl: `${process.env.IMAGE_FILE_HOST}/images/giraffe01.png`,
        //thumbnailImageResourceId: '',
        title: 'Carousel postback title',
        text: 'Carousel postback text (default button)',
        defaultAction: {
          type: 'postback',
          label: 'ButtonTemp',
          data: 'button_template',
          displayText: 'button_template ください'
        },
        actions: [
          {
            type: 'postback',
            label: 'ListTemp',
            data: 'list_template',
            displayText: 'list_template ください'
          },
          {
            type: 'postback',
            label: 'Carousel',
            data: 'carousel',
            displayText: 'carousel ください'
          },
          {
            type: 'postback',
            label: 'QuickReply',
            data: 'q',
            displayText: 'QuickReply ください'
          }
        ]
      },
      {
        thumbnailImageUrl: `${process.env.IMAGE_FILE_HOST}/images/panda01.png`,
        //thumbnailImageResourceId: '',
        title: 'Carousel uri title',
        text: 'Carousel uri text',
        defaultAction: {
          type: 'uri',
          label: 'LINE WORKS',
          uri: 'https://line.worksmobile.com/jp/'
        },
        actions: [
          {
            type: 'uri',
            label: 'LINE WORKS',
            uri: 'https://line.worksmobile.com/jp/'
          },
          {
            type: 'uri',
            label: 'bot Action Objects',
            uri: 'https://developers.worksmobile.com/jp/document/1005050?lang=ja'
          }
        ]
      },
      {
        thumbnailImageUrl: `${process.env.IMAGE_FILE_HOST}/images/sushi.png`,
        //thumbnailImageResourceId: '',
        title: 'Carousel message title',
        text: 'Carousel message text',
        defaultAction: {
          type: 'message',
          label: 'Message',
          text: 'Message text'
        },
        actions: [
          {
            type: 'message',
            label: 'Yes',
            text: 'Yes'
          },
          {
            type: 'message',
            label: 'No',
            text: 'No'
          }
        ]
      }
    ];
  }

  /**
   * Image carousel コンテンツを返します。
   * @param {Array} conditions 条件
   * @return {object} コンテンツ
   */
  _getImageCarouselContent(...conditions) {
    if (!conditions.some(condition => condition && (condition.toUpperCase() === 'I' || condition === MESSAGE_CONTENT_TYPE.imageCarousel))) return;
    return { 
      type: MESSAGE_CONTENT_TYPE.imageCarousel,
      columns: this._getImageCarouselColumns()
    };
  }

  /**
   * Image carousel カラムリストを返します。
   * @return {Array} カラムリスト
   */
  _getImageCarouselColumns() {
    // image_carousel.columnsのactionでは typeはmessageとuri、postbackしか使えない。つまり camera、cameraRoll、locationは使えない
    // image_carousellは、postbackを使える！！！！
    // 最大３つまでのカラムしか使えない！！！
    return [
      {
        imageUrl: `${process.env.IMAGE_FILE_HOST}/images/giraffe01.png`,
        //imageResourceId: '',
        action: {
          type: 'postback',
          label: 'ButtonTemp',
          data: 'button_template',
          displayText: 'button_template ください'
        }
      },
      {
        imageUrl: `${process.env.IMAGE_FILE_HOST}/images/lw.png`,
        //imageResourceId: '',
        action: {
          type: 'postback',
          label: 'ListTemp',
          data: 'list_template',
          displayText: 'list_template ください'
        }
      },
      {
        imageUrl: `${process.env.IMAGE_FILE_HOST}/images/sushi.png`,
        //imageResourceId: '',
        action: {
          type: 'postback',
          label: 'Carousel',
          data: 'carousel',
          displayText: 'carousel ください'
        }
      }
    ];
  }
}