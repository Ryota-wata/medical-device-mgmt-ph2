/*
 * 顧客ワイヤー ⇔ モック 間のデータ受け渡しブリッジ（ワイヤー側）
 *
 * scripts/sync-wireframes.mjs が、ワイヤーのコピーの </head> 直前にアダプタ → 本ファイルの順で注入する。
 * 説明部分を本文の描画前に隠すため head に置いている。本文の要素やワイヤーの関数は DOMContentLoaded 後に使う。
 * 顧客のワイヤー原本は書き換えない。
 *
 * メッセージ形式（親側は lib/wireframes/useWireframeBridge.ts）
 *   親 → ワイヤー : { type: 'wf:ping' }                      wf:ready を再要求
 *   親 → ワイヤー : { type: 'wf:data',     payload }          アダプタの needs に応じたモックのデータ
 *   親 → ワイヤー : { type: 'wf:guide',    visible }          説明部分の表示切替
 *   親 → ワイヤー : { type: 'wf:control',  id, value }        画面・ロール切替などの操作
 *   ワイヤー → 親 : { type: 'wf:ready',    wireframeId, needs, hasGuide, controls, missingSelectors }
 *   ワイヤー → 親 : { type: 'wf:controls', wireframeId, controls }  操作の現在値が変わった
 *   ワイヤー → 親 : { type: 'wf:selection', wireframeId, items }
 *   ワイヤー → 親 : { type: 'wf:result',   wireframeId, action, items }
 *
 * アダプタは window.__wfAdapter に次を定義する（apply 以外は宣言だけでよい）。
 *   id             : ワイヤーの識別名
 *   guideSelectors : 顧客が画面の外に書いた説明（見出し・操作ガイド・設計メモ）の範囲。既定で非表示
 *   controls       : 説明部分に含まれる操作のうち、モック側に出すもの
 *                    { id, label, type: 'select',  selector }               … <select> の値を切り替える
 *                    { id, label, type: 'buttons', selectors, activeClass } … 押すボタンを選ぶ（画面切替）
 *                      表示中のボタンがクラスで判定できないワイヤーは、activeClass の代わりに
 *                      current: function () { return 表示中のボタンのセレクタ } を書く
 *   needs          : 受け取りたいモックのデータ名（lib/wireframes/dataSources.ts のキー）
 *   apply(payload, bridge) : 受け取ったデータをワイヤーに反映する。
 *                    wf:ready の再送などで複数回呼ばれ得るので、毎回入れ替える形で書く（追記しない）
 */
(function () {
  'use strict';

  var adapter = window.__wfAdapter;
  // iframe 外で直接開かれた場合は何もしない（ワイヤー単体の動作を壊さない）
  if (!adapter || window.parent === window) return;

  var origin = window.location.origin;
  var root = document.documentElement;
  var controls = adapter.controls || [];

  // ---- 説明部分の非表示 ----
  var guideSelectors = adapter.guideSelectors || [];
  if (guideSelectors.length) {
    var style = document.createElement('style');
    style.textContent = guideSelectors
      .map(function (sel) { return 'html.wf-hide-guide ' + sel; })
      .join(',') + '{display:none!important}';
    document.head.appendChild(style);
    root.classList.add('wf-hide-guide');
  }

  // ---- 操作（画面・ロール切替） ----
  function textOf(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function describe(control) {
    if (control.type === 'select') {
      var select = document.querySelector(control.selector);
      if (!select) return null;
      return {
        id: control.id,
        label: control.label,
        type: 'select',
        value: select.value,
        options: Array.prototype.map.call(select.options, function (o) {
          return { value: o.value, label: textOf(o) };
        }),
      };
    }
    if (control.type === 'buttons') {
      var active = '';
      var options = [];
      control.selectors.forEach(function (sel) {
        var button = document.querySelector(sel);
        if (!button) return;
        options.push({ value: sel, label: textOf(button) });
        if (!control.current && control.activeClass && button.classList.contains(control.activeClass)) active = sel;
      });
      if (control.current) {
        try {
          active = control.current() || '';
        } catch (e) {
          active = '';
        }
      }
      return { id: control.id, label: control.label, type: 'buttons', value: active, options: options };
    }
    return null;
  }

  function describeAll() {
    return controls.map(describe).filter(Boolean);
  }

  function setControl(id, value) {
    var control = controls.find(function (c) { return c.id === id; });
    if (!control) return;
    if (control.type === 'select') {
      var select = document.querySelector(control.selector);
      if (!select) return;
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (control.type === 'buttons' && control.selectors.indexOf(value) >= 0) {
      var button = document.querySelector(value);
      if (button) button.click();
    }
  }

  function post(message) {
    message.wireframeId = adapter.id;
    window.parent.postMessage(message, origin);
  }

  // ワイヤー内の操作で画面やロールが変わったら、現在値を親へ伝える
  var lastControls = '';
  function notifyControls() {
    if (!domReady) return;
    var current = describeAll();
    var json = JSON.stringify(current);
    if (json === lastControls) return;
    lastControls = json;
    post({ type: 'wf:controls', controls: current });
  }
  if (controls.length) {
    ['click', 'change'].forEach(function (type) {
      document.addEventListener(type, function () { setTimeout(notifyControls, 0); }, true);
    });
  }

  var bridge = {
    sendSelection: function (items) {
      post({ type: 'wf:selection', items: items });
    },
    sendResult: function (action, items) {
      post({ type: 'wf:result', action: action, items: items });
    },
  };

  // 顧客が新しい版で id やクラスを変えると、隠す・操作する対象が黙って消えるので親へ知らせる
  function missingSelectors() {
    var selectors = guideSelectors.slice();
    controls.forEach(function (c) {
      if (c.type === 'select') selectors.push(c.selector);
      if (c.type === 'buttons') selectors = selectors.concat(c.selectors);
    });
    return selectors.filter(function (sel) { return !document.querySelector(sel); });
  }

  // head で実行されるため、本文が揃うまでは ready を送らない（DOMContentLoaded 時に送る）
  var domReady = false;

  function sendReady() {
    if (!domReady) return;
    var current = describeAll();
    lastControls = JSON.stringify(current);
    var missing = missingSelectors();
    if (missing.length) console.warn('[wf-bridge] 見つからないセレクタ: ' + missing.join(', '));
    post({
      type: 'wf:ready',
      needs: adapter.needs || [],
      hasGuide: guideSelectors.length > 0,
      controls: current,
      missingSelectors: missing,
    });
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== origin || event.source !== window.parent) return;
    var data = event.data;
    if (!data) return;
    if (data.type === 'wf:ping') sendReady();
    if (data.type === 'wf:data' && adapter.apply && domReady) {
      adapter.apply(data.payload, bridge);
      setTimeout(notifyControls, 0);   // データ反映で画面が切り替わることがある
    }
    if (data.type === 'wf:guide') root.classList.toggle('wf-hide-guide', !data.visible);
    if (data.type === 'wf:control' && domReady) {
      setControl(data.id, data.value);
      setTimeout(notifyControls, 0);
    }
  });

  function onDomReady() {
    domReady = true;
    sendReady();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onDomReady);
  else onDomReady();
})();
