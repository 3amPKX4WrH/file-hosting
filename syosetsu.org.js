// ==UserScript==
// @name         Syosetsu hidden lines
// @namespace    http://tampermonkey.net/
// @version      2024-03-27
// @description  try to take over the world!
// @author       You
// @match        https://syosetu.org/novel/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=syosetu.org
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .color[style*="rgba(0, 0, 0, 0)"] {
            color: red !important;
        }
    `)
})();
