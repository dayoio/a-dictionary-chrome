'use strict';

function getSelected() {
  var text;
  if (window.getSelection)       text = window.getSelection().toString();
  else if (document.getSelection) text = document.getSelection();
  else if (document.selection)    text = document.selection.createRange().text;
  return text.trim();
}

function query() {
  var text = getSelected();

  //
  chrome.runtime.sendMessage({act: 'query', q: text}, function (response) {
    if (chrome.runtime.lastError != null) {
      return;
    }
    if (response.error) {
    } else {
      console.log(response.result);
    }
  })
}

// Ctrl/Cmd + 滑鼠雙擊
window.addEventListener('dblclick', function (event) {
  var a = document.createElement("div");
  //if (event.metaKey || event.ctrlKey) query();
});

chrome.runtime.onMessage.addListener(function (m, s, r) {
  m.act === 'get_selection' && (m = getSelected() ) && r({selection: m});
});