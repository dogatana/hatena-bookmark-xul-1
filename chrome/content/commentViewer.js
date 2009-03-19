
const B_URL = 'http://b.hatena.ne.jp/';
const CMD_EVENT_NAME = 'hBookmark-view-comments';
/*
 * comment.html から、外部 html リンクが開けてしまうと、セキュリティ的にまずいので注意
 */

window.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    let link;
    let t = e.target;
    if (t.id == 'close-button-img') 
        return close();
    if (t.tagName == 'A') {
        link = t.href;
    } else if (t.tagName == 'IMG') {
        if (t.parentNode.tagName == 'A') {
            link = t.parentNode.href;
        }
    }
    // openUILink(link, e);
    if (link) {
        openUILinkIn(link, 'tab');
        close();
    }
}, false);

let lastEID = null;

var dispatchMethods = {
    'load-json': function(data) {
        if (!data) {
            clear();
            return;
        } else {
            // 同じ eid なら描画し直さない
            if (data.eid == lastEID) {
                return;
            } else {
                lastEID = data.eid;
                clear();
            }
        }
        $('title').appendChild(T(data.title));
        p.b(function() {
            if (data.bookmarks) data.bookmarks.forEach(function(b) {
                let li = E('li');
                let userlink = B_URL + b.user + '/';
                let ymd = b.timestamp.split(' ')[0];
                let permalink = userlink + ymd.replace(/\//g, '') + '#' + data.eid;
                let icon = userIcon(b.user);
                li.appendChild(E('a', {href: permalink, className: 'user-permalink'}, icon));
                li.appendChild(E('a', {href: permalink, className: 'username'}, b.user));
                if (b.tags) b.tags.forEach(function(tag, index) {
                    let userlinkTag = userlink + '/t/' + encodeURIComponent(tag);
                    if (index) li.appendChild(T(', '));
                    li.appendChild(E('a', {href: userlinkTag, className:'tag'}, tag));
                });
                li.appendChild(E('span', {className: 'comment'}, b.comment));
                li.appendChild(E('span', {className: 'timestamp'}, ymd));
                $('list').appendChild(li);
            });
        }, 'comment rendered');

        /*
         * 即座に取得すると高さ0が返るので…
         */
        setTimeout(function() {
            let rect = document.body.getBoundingClientRect();
            let height = rect.bottom - rect.top;
            window.scrollTo(0, 0);
            throwEvent('rendered', {
                height: parseInt(height),
            });
        }, 10);
    }
};


document.commandDispatcher = top.document.commandDispatcher;
top.addEventListener(CMD_EVENT_NAME, function(ev) {
    if (typeof dispatchMethods == 'undefined') return; // XXX: why?
    let m = dispatchMethods[ev.getData('method')];
    if (m) m(ev.getData('data'));
}, false);

let throwEvent = function(method, data) {
     let ev = top.document.createEvent('DataContainerEvent');
     ev.initEvent(CMD_EVENT_NAME, false, false);
     ev.setData('method', method);
     ev.setData('data', data);
     top.dispatchEvent(ev);
}

let E = function(name, attr) {
    var children = Array.slice(arguments, 2);
    var e = document.createElement(name);
    if (attr) for (let key in attr) e[key] = attr[key];//e.setAttribute(key, attr[key]);
    children.map(function(el) el.nodeType > 0 ? el : document.createTextNode(el)).
        forEach(function(el) e.appendChild(el));
    return e;
}

let close = function() {
    throwEvent('close');
}

let userIcon = function(username) {
    return E('img', {
        src: 'http://www.hatena.ne.jp/users/' + username.substring(0, 2) + '/' + username + '/profile_s.gif',
        className: 'usericon',
        alt: username,
    });
}


let p = function(el) {
    top.hBookmark.p(el);
}

p.b = function(func, name) {
    name = 'Benchmark ' + (name || '') + ': ';
    let now = new Date * 1;
    func();
    let t = (new Date * 1) - now;
    p(name + t);
    return t;
}

let T = function(text) {
    return document.createTextNode(text);
}

let $ = function(name) {
    return document.getElementById(name);
}

let removeAll = function(el) {
    while (el.firstChild) el.removeChild(el.firstChild); 
}

let clear = function() {
    removeAll($('title'));
    removeAll($('count'));
    removeAll($('list'));
}

