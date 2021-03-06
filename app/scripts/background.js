'use strict';

angular.module('bgApp', [])
  .controller('bgCtrl', function ($scope, $http, $q) {

    // 查詢 START
    chrome.runtime.onMessage.addListener(function (message, sender, response) {
      if (message.act === 'query') {
        chrome.storage.sync.get({language: 'en'}, function (conf) {
          //message.q = message.q.toLowerCase();
          query(message.q, conf.language).then(function (d) {
            var r = {dicts: []};
            make(r, d, conf.language);
            //如果查詢的單詞不是en，或者目標語言不是en就查詢多一次en
            if (r.src !== 'en' && conf.language !== 'en') {
              query(message.q, 'en').then(function (d) {
                r.dicts = [];
                make(r, d, 'en');
                return response({result: r});
              }, function () {
                return response({result: r});
              })
            } else
              return response({result: r});
          }, function () {
            return response({error: 'Nothing found.'});
          })
        })
      }
      // 查詢 END
      // 打開設置頁面 START
      else if (message.act === 'options') {
        chrome.tabs.create({url: chrome.runtime.getURL("options.html")})
      }
      // 打開設置頁面 END
      // 搜索引擎 START
      else if (message.act === 'search') {
        if (message.method === 'wiki') {
          //用my language搜索
          chrome.storage.sync.get({language: 'en'}, function (items) {
            chrome.tabs.create({url: 'https://' + items.language.substr(0, 2) + '.wikipedia.org/wiki/' + message.q});
          })
        } else {
          // 默認google
          chrome.tabs.create({url: 'https://www.google.com/#q=' + message.q});
        }
      }
      // 搜索引擎 END
      return true;
    })

    //整理
    function make(r, d, tl) {
      parse(r, d, tl);
      parseTrans(r, d);
      parseDefine(r, d);
    }

    //重新處理獲取到的數據
    function resTransform(data) {
      data = data.replace(/(\[,{1,}|,{1,}\]|,{2,})/g, function (val) {
        return val.split("").join('""');
      })
      return JSON.parse(data);
    }

    //請求Google Translate
    function query(q, tl) {
      if (q.match(/^\w+/)) q = q.toLowerCase();
      var d = $q.defer();
      $http({
        method: 'GET',
        transformResponse: resTransform,
        timeout: 8000,
        params: {q: q, tl: tl},
        url: 'https://translate.google.com/translate_a/single?client=t&sl=auto&hl=en&dt=bd&dt=ex&dt=ld&dt=md&dt=qc&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&ssel=0&tsel=3&otf=1&tk=518775|164927'
      })
        .success(function (data, status) {
          d.resolve(data);
        })
        .error(function (data, status) {
          d.reject();
        })
      return d.promise;
    }

    // 解析 START
    function parse(r, data, tl) {
      var d, word, symbol, y;
      // 單詞語言
      r.src = data[2];
      //if(r.src == tl)
      //  return;
      // 音標 START
      d = data[0]

      if(!r.trans)
        r.trans = [];

      word = d[0][0];
      symbol = d[1]?d[1][2]:null;
      if(word)
        appendTrans(r, word, symbol, tl);

      word = d[0][1];
      symbol = d[1]?d[1][3]:null;
      if(word)
        appendTrans(r, word, symbol, r.src);

      // 音標 END
    }

    function appendTrans(r, w, s, tl)
    {
      for(var i=0;i< r.trans.length;i++)
      {
        if( w == r.trans[i].word )
          return;
      }
      r.trans.push({
        'word': w,
        'symbol': s,
        'audio': 'https://translate.google.com/translate_tts?ie=UTF-8&client=t&tl=' + tl + '&q=' + w,
        'lan': tl
      })
    }

    function parseTrans(r, data) {
      var a, d, i;
      // 目標語言定義 START
      d = data[1] || "";
      if (angular.isArray(d)) {
        var tl = {title: 'Translated Definitions', types: []}
        for (i = 0; i < d.length; i++) {
          //0: 類型 1: 解釋 2: 同義詞 3: 單詞 4: 排行
          // 類型處理
          a = {
            pos: d[i][0],
            terms: d[i][1],
            base_form: d[i][3],
            pos_enum: d[i][4],
            entry: d[i][2].map(function (val) {
              return {word: val[0], trans: val[1]};
            })
          }
          tl.types.push(a);
        }
        r.dicts.push(tl);
      }
      // 目標語言定義 END
    }

    // 解析獲取到的數據，原數據是數組，轉換成和Google Dictionary的一樣
    function parseDefine(r, data) {
      var d, i;
      // 自定義 START
      d = data[12];
      if (angular.isArray(d)) {
        var sl = {title: "Definitions", types: []};
        for (i = 0; i < d.length; i++) {
          var a = {
            pos: d[i][0],
            entry: d[i][1].map(function (val) {
              return {word: val[0]};
            })
          }
          sl.types.push(a);
        }
        r.dicts.push(sl);
      }
      // 自定義 END
      // 同意詞 START
      d = data[11];
      if (angular.isArray(d)) {
        var sy = {title: "Synonyms", types: []};
        for (i = 0; i < d.length; i++) {
          var a = {
            pos: d[i][0],
            entry: d[i][1].map(function (val) {
              return {trans: val[0]};
            })
          }
          sy.types.push(a);
        }
        r.dicts.push(sy);
      }
      // 同意詞 END
    }

    // 日語定義 START(TODO)
    // 日語定義 END

    // 解析 END
  });

chrome.runtime.onInstalled.addListener(function (details) {
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (details.requestHeaders) {
      for (var i = 0; i < details.requestHeaders.length; i++) {
        if (details.requestHeaders[i].name == 'Referer') {
          details.requestHeaders[i].value = "https://translate.google.com/";
        }
      }
    }
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["https://translate.google.com/*"]}, ['requestHeaders', 'blocking']);