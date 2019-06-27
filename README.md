# dialogflow-tutorial

[Dialogflow の チュートリアル](https://dialogflow.com/docs/tutorial-build-an-agent) を Webhook + JSON で試した際のサンプル

ブログ記事

[Dialogflow のチュートリアルを試してみた : context と fulfillment (1/2)](https://blog.mori-soft.com/entry/2019/06/27/160743)

[Dialogflow のチュートリアルを試してみた : events を使って書き換え (2/2)](https://blog.mori-soft.com/entry/2019/06/27/160908)

を参照

## Dialogflow Agent インポート用の zip ファイルの作成方法

1. リポジトリを clone
1. ./bin/zipDialogflow を実行
1. BikeShopExample.zip が出来上がる
1. Dialogflow のコンソールにて Agent を作成
1. Agent の設定画面を開く
1. Export and import より 作成した zip ファイルを import する
1. Fulfillment の Webhook URL を自身のサーバーに設定する

以上
