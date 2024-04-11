// ==UserScript==
// @name         Syosetsu hidden lines
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  try to take over the world!
// @author       You
// @match        https://syosetu.org/novel/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=syosetu.org
// @require      https://raw.githubusercontent.com/3amPKX4WrH/file-hosting/main/opencc.data.js
// @require      https://raw.githubusercontent.com/3amPKX4WrH/file-hosting/main/opencc.cn2t.js
// @require      https://raw.githubusercontent.com/3amPKX4WrH/file-hosting/main/opencc.t2cn.js
// @require      https://raw.githubusercontent.com/3amPKX4WrH/file-hosting/main/opencc.custom.js
// @require      https://raw.githubusercontent.com/3amPKX4WrH/file-hosting/main/opencc.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap');
        .color[style*="rgba(0, 0, 0, 0)"],
        .color[style*="transparent"] {
            color: red !important;
        }

        .translated {
            color: #0007;
            font-family: "Noto Sans SC", sans-serif !important;
        }

        body.night .translated {
            color: #fff7;
        }

        .translate-line {
            position: relative;
        }
        
        .translate-line .toggle {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translate(-30px, -50%);
            opacity: 0;
            cursor: pointer;
        }

        .translate-line:hover .toggle {
            opacity: 1;
        }

        .translate-line .toggle::before {
            content: "\\2795";
        }

        .translate-line .toggle.show::before {
            content: "\\2796";
        }
    `)

    const Traditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
    const body = document.getElementById('honbun'),
        [_, article, chapter] = location.pathname.match(/(\d+)\/(\d+)/) || [];
    if (!body || !article) return;

    const cleanLine = line => line.trim(),
        startSpace = line => (line.match(/^\s+/) || [])[0] || '',
        onNClick = (callback, n = 2, threshold = 300) => {
            let count = 0,
                lastClick = 0;

            return event => {
                const currentTime = new Date().getTime();
                if (currentTime - lastClick < threshold) {
                    count++;
                    if (count === n) {
                        callback(event);
                        count = 0;
                    }
                } else {
                    count = 1;
                }
                lastClick = currentTime;
            }
        };
    GM_xmlhttpRequest({
        method: 'GET',
        url: `https://books.fishhawk.top/api/novel/hameln/${article}/chapter/${chapter}`,
        onload: ({ responseText }) => {
            try {
                let { paragraphs, youdaoParagraphs, sakuraParagraphs } = JSON.parse(responseText),
                    article = (paragraphs || []).map(cleanLine);

                youdaoParagraphs = youdaoParagraphs || [];
                sakuraParagraphs = sakuraParagraphs || [];
                for (const line of body.querySelectorAll('p[id]')) {
                    let text = cleanLine(line.innerText),
                        index = article.findIndex(paragraph => paragraph === text);

                    if (text && index >= -1) {
                        let on = false,
                            lines;

                        line.classList.add('translate-line');

                        const toggle = document.createElement('span');
                        toggle.classList.add('toggle');

                        const callback = () => {
                            let prev = line.previousElementSibling,
                                state = 0;
                            lines = lines || [...new Set([
                                sakuraParagraphs[index],
                                youdaoParagraphs[index],
                            ])].map(version => {
                                version = Traditional(version);

                                let space = startSpace(line.innerText);
                                if (startSpace(version) !== space) {
                                    version = space + cleanLine(version);
                                }

                                return version;
                            });
                            if (!prev?.classList?.contains('translated')) {
                                prev = document.createElement('div');
                                prev.classList.add('translated');
                                body.insertBefore(prev, line);

                                prev.innerText = lines[0];
                                prev.onclick = onNClick(() => {
                                    state++;
                                    prev.innerText = lines[state % lines.length];
                                })
                            }

                            on = !on;
                            prev.style.display = on ? 'block' : 'none';
                            toggle.classList.toggle('show');
                        }
                        toggle.onclick = callback;
                        line.onclick = onNClick(callback);

                        line.appendChild(toggle);
                    }
                }
            } catch (e) { }
        }
    })
})();
