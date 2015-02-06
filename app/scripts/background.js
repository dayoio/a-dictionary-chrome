'use strict';


angular.module('bgApp', [])
  .controller('bgCtrl', function ($scope, $http, $q) {

    chrome.runtime.onMessage.addListener(function (message, sender, response) {
      if (message.act === 'fetch') {

      } else if (message.act === 'popup') {
        query(message.q, 'zh_CN').then(function (d) {
          return response({result: d})
        }, function (err) {
        })
      } else if (message.act === 'options') {
        chrome.tabs.create({url: chrome.runtime.getURL("options.html")})
      }
      return true;
    })

    //重新處理獲取到的數據
    function resTransform(data) {
      data = data.replace(/(\[,{1,}|,{1,}\]|,{2,})/g, function (val) {
        return val.split("").join('""');
      })
      return JSON.parse(data);
    }

    //請求Google Translate
    function query(q, tl) {
      var d = $q.defer();
      $http({
        method: 'GET',
        transformResponse: resTransform,
        params: {q: encodeURIComponent(q), tl: tl},
        url: 'https://translate.google.com/translate_a/single?client=t&sl=auto&hl=en&dt=bd&dt=ex&dt=ld&dt=md&dt=qc&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&ssel=0&tsel=3&otf=1&tk=518775|164927'
      })
        .success(function (data, status) {
          d.resolve(parse(data));
        })
        .error(function (data, status) {
          d.reject();
        })
      return d.promise;
    }


    // 解析獲取到的數據，原數據是數組，轉換成和Google Dictionary的一樣
    function parse(data) {
      var r, i, j, d, ed;
      r = {}
      // 單詞語言
      r.src = data[2];
      // 音標 START
      d = data[0]
      r.trans = d[0][0];
      r.translit = d[1][2];
      var o = d[0][1];
      if (o && ( o !== r.trans || d[1][3] !== "" )) {
        r.orig = d[0][1];
        r.origlit = d[1][3];
      }
      // 音標 END

      r.dicts = [];
      // 目標語言定義 START
      d = data[1] || "";
      if (angular.isArray(d)) {
        var tl = {title: 'Translated Definitions', types: []}
        for (i = 0; i < d.length; i++) {
          //0: 類型 1: 解釋 2: 同義詞 3: 單詞 4: 排行
          // 類型處理
          var a = {
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

      // 日語定義 START(TODO)
      // 日語定義 END

      return r;
    }


  })

//chrome.tabs.create({url:chrome.runtime.getURL("options.html")})

chrome.runtime.onInstalled.addListener(function (details) {
  //console.log('previousVersion', details.previousVersion);

  //chrome.storage.sync.set({}, function (items) {
  //
  //})
});

