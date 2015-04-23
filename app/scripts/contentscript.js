'use strict';

(function () {
  var dict;

  //點擊事件，檢測是否在彈出窗口上
  function checkclick(e) {
    for (var c = e.target; c; c = c.parentNode) {
      if (c === dict.view)
        return true;
    }
    return false;
  }

  //鼠標釋放事件
  function onMouseup(e) {
    if (!checkclick(e)) {
      dict && dict.clear();
    }
    onDblclick(e);
  }

  //雙擊事件
  function onDblclick(e) {
    var b = function (options) {
      query(e, options);
    }

    chrome.storage.sync.get({
      dbclick: false,
      select: true,
      dbclick_key: 'ctrl',
      select_key: 'ctrl'
    }, b);
  }

  //大小
  function rect(a, b, c, d) {
    this.top = a;
    this.right = b;
    this.bottom = c;
    this.left = d
  }

  //箭頭
  function getArrow(a, b) {
    var c = a.cloneNode(false), f = a.cloneNode(false), d = a.cloneNode(false);
    c.id = "dict-arrow-main";
    "up" === b ? (f.id = "dict-arrow-inner-up", d.id = "dict-arrow-outer-up") : (f.id = "dict-arrow-inner-down", d.id = "dict-arrow-outer-down");
    c.appendChild(f);
    c.appendChild(d);
    return c
  }

  //調整位置
  function fix(dict) {
    dict.main.style.left = "0";
    dict.main.style.top = "0";
    var b = dict.main.offsetWidth,
      c = dict.main.offsetHeight,
      f = [window.pageXOffset, window.pageYOffset],
      d = f[0],
      g = [dict.target.left + d, dict.target.top + f[1]],
      n = dict.target.bottom - dict.target.top,
      z = g[0] + (dict.target.right - dict.target.left) / 2,
      f = d + document.documentElement.offsetWidth,
      l = z - b / 2;
    l + b > f && (l = f - b);
    l < d && (l = d);
    var r = g[1] - c - 12 + 1, m = g[1] + n + 12 - 1;
    i:if (b = new rect(r, l + b, r + c, l), b.top < window.pageYOffset)b = !1; else {
      for (var c = document.getElementsByTagName("embed"), A = document.getElementsByTagName("object"), p = [window.pageXOffset, window.pageYOffset], B = p[0], p = p[1], q = 0, K = c.length + A.length; q <
      K; q++) {
        var h = (q < c.length ? c[q] : A[q - c.length]).getBoundingClientRect(), h = new rect(h.top + p, h.right + B, h.bottom + p, h.left + B);
        if (b.bottom > h.top && h.bottom > b.top && b.left < h.right && h.left < b.right) {
          b = !1;
          break i

        }
      }
      b = !0
    }
    if (b) {
      m = dict.down;
      m.style.top = g[1] - 12 + "px"
    } else {
      r = m;
      m = dict.up;
      m.style.top = g[1] + n + 1 + "px";
    }
    g = z - 12;
    m.style.left = g + "px";
    g - 5 > d && g + 24 + 5 < f && dict.arrows.appendChild(m);
    dict.main.style.top = r + "px";
    dict.main.style.left = l + "px";
  }

  //請求
  function query(evt, options) {
    var d;
    //事件判斷
    if (evt.type === "mouseup") {
      d = options.select && checkKey(evt, options.select_key);
    }
    else if (evt.type === "dblclick") {
      if (options.select && checkKey(evt, options.select_key)) {
        d = false;
      } else {
        d = options.dbclick && checkKey(evt, options.dbclick_key);
      }
    } else {
      d = false;
    }
    //console.log("key: " + d);
    //成功觸發
    if (d) {
      //去除編輯狀態
      //console.log("check tag");
      if (!checkTag(evt.target)) {
        //console.log("get selection");
        //獲取選中的字符串
        var q = "";
        if (window.getSelection) {
          q = window.getSelection();
          if (1 > q.rangeCount)return;
          d = q.getRangeAt(0);
          q = clear(q.toString())
        } else {
          document.selection && (d = document.selection.createRange(), q = clear(d.text));
        }
        //console.log("check selection");
        //獲取到的字符串判斷
        if (!(!q || q.length === 1 && 127 >= q.charCodeAt(0) && !q.match(/[0-9A-Za-z]/) || "dblclick" === evt.type && q.indexOf(" ") !== -1)) {
          //獲取目標文本大小
          if (!inDict(dict, evt))
            getClientRect(dict, d);
          //加入窗口
          dict.body.innerHTML = "Searching...";
          dict.header.className = "display-none";
          dict.footer.className = "display-none";
          document.documentElement.appendChild(dict.view);
          fix(dict);
          //查詢
          chrome.runtime.sendMessage({act: 'query', q: q}, onResult)
        }
      }

    }
  }

  function getClientRect(a, b) {
    var c = b.getBoundingClientRect();
    a.target = new rect(c.top, c.right, c.bottom, c.left)
  }

  function inDict(dict, evt) {
    for (var c = evt.target; c; c = c.parentNode)if (c === dict.view) return !0;
    return !1
  }

  //特殊字符
  function clear(a) {
    return a.replace(/^\s+|\s+$/g, "")
  }

  //是否在編輯狀態
  function checkTag(a) {
    if (a && a.tagName) {
      var b = a.tagName.toLowerCase();
      if ("input" === b || "textarea" === b)
        return true;
    }
    if (document.designMode && "on" === document.designMode.toLowerCase())
      return true;
    while (a.parentNode) {
      a = a.parentNode
      if (a.isContentEditable)
        return true;
    }
    return false
  }

  //是否觸發
  function checkKey(a, b) {
    return "none" === b || "alt" === b && a.altKey || "ctrl" === b && (-1 !== window.navigator.platform.toLowerCase().indexOf("mac") ? a.metaKey : a.ctrlKey) || "shift" === b && a.shiftKey
  }

  function onResult(data) {
    if (!dict) return;
    dict.clear();
    dict.header.className = "display-none";
    dict.footer.className = "display-none";
    if (data.result) {
      var d = data.result;

      var head = '<div id="trans">';
      head += '<span class="headword">' + d.trans + '</span>';
      if (d.translit)
        head += '<span class="symbol">' + d.translit + '</span><span class="audio"></span>';
      dict.trans_audio.src = d.trans_audio;
      if (d.orig && d.orig !== d.trans) {
        head += '</div><div id="orig">';
        head += '<span class="headword">' + d.orig + '</span>';
        if (d.origlit)
          head += '<span class="symbol">' + d.origlit + '</span><span class="audio"></span>';
        dict.orig_audio.src = d.orig_audio;
      }
      head += '</div>';

      var terms = "";
      for (var i = 0; i < d.dicts.length; i++) {
        var t = d.dicts[i];
        if (t.title !== 'Synonyms') {
          if (t.types && t.types.length > 0) {
            if (t.types[0].terms) {
              terms += '<p><span id="pos">' + t.types[0].pos + '</span>';
              var j_max = Math.min(t.types[0].terms.length, 5);
              for (var j = 0; j < j_max; j++) {
                terms += t.types[0].terms[j];
                if (j < j_max - 1)
                  terms += ", ";
              }
              terms += '</p>';
            } else if (t.types[0].entry) {
              terms += '<p>' + t.types[0].entry[0].word + '</p>';
            }
          }
        }
      }
      //more
      dict.header.className = "";
      dict.header.innerHTML = head;
      dict.body.innerHTML = terms;
      dict.footer.className = "";
      dict.footer.innerHTML = '<a target="_blank" href="https://www.google.com/#q=' + (d.orig || d.trans ) + '">More &raquo;</a>';
    } else {
      dict.body.innerHTML = "No definition found.";
    }
    document.documentElement.appendChild(dict.view);
    fix(dict);
  }

  //獲取選中文本
  function onSelected(m, s, r) {
    if (m.act !== 'get_selection') return;
    var txt;
    if (window.getSelection) {
      txt = window.getSelection().toString();
    }
    else if (document.selection) {
      txt = document.selection.createRange().text;
    }
    if (txt)
      r({selection: clear(txt)});
  }

  var Dict = function () {

    var init = function (css) {
      //初始化
      var d = document.createElement("div");
      this.view = d.cloneNode(false);
      this.view.id = "dict-view";
      this.shadow = this.view.createShadowRoot ? this.view.createShadowRoot() : this.view.webkitCreateShadowRoot();
      //樣式
      var style = document.createElement("style");
      style.innerHTML = css;
      this.shadow.appendChild(style);
      //內容框
      this.main = d.cloneNode(false);
      this.main.id = "dict-main";
      this.shadow.appendChild(this.main);

      this.header = d.cloneNode(false);
      this.header.id = "dict-header";

      this.trans_audio = document.createElement("audio");
      this.orig_audio = document.createElement("audio");

      this.header.onclick = function (e) {
        if (e.target && e.target.className === "audio" && e.target.parentNode) {
          //
          if (e.target.parentNode.id === 'trans') {
            this.trans_audio.play();
          } else if (e.target.parentNode.id === 'orig') {
            this.orig_audio.play();
          }
        }
      }.bind(this);

      this.body = d.cloneNode(false);
      this.body.id = "dict-body";

      //more
      this.footer = d.cloneNode(false);
      this.footer.id = "dict-footer";

      this.main.appendChild(this.header);
      this.main.appendChild(this.body);
      this.main.appendChild(this.footer);

      //箭頭
      this.arrows = d.cloneNode(false);
      this.shadow.appendChild(this.arrows);

      this.up = getArrow(d, "up");
      this.down = getArrow(d, "down");


    }.bind(this);

    function load(url, init) {
      var c = new XMLHttpRequest;
      c.open("GET", url, true);
      c.onload = function () {
        var a = null;
        if (this.status === 200)
          return init(c.response)
      };
      c.send()
    };
    //
    load(chrome.runtime.getURL("styles/content.css"), init);

    //偵聽
    window.addEventListener("resize", this.clear)
    document.addEventListener("mouseup", onMouseup);
    document.addEventListener("dblclick", onDblclick);
    chrome.runtime.onMessage.addListener(onSelected);

    //刪除
    this.clear = function () {
      //remove dict from document
      this.view && this.view.parentNode && this.view.parentNode.removeChild(this.view);
      //clear arrow
      for (var a = this.arrows; a && a.hasChildNodes();)a.removeChild(a.childNodes[0])
    }.bind(this);
  }

  //install
  if (window.dictInstance) {
    chrome.runtime.onMessage.removeListener(onSelected);
    window.dictInstance.clear();
  }
  window.dictInstance = dict = new Dict;
})();