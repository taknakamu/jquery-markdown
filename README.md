[jquery-markdown](http://demo.neutrinoboy.jp/jquery-markdown/)
=================

マークダウン記法で書かれたテキストを変換します。

### 使用方法
````javascript
$(".markdown-text").markdown();
````

### オプション
違う要素に結果を挿入する場合
````javascript
$(".markdown-text").markdown({
    target_form: ".markdown-target"
});
````
