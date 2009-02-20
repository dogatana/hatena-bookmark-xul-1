
const EXPORT = ['async', 'net'];

/*
 * あとで jsm に移植？
 */

var async = {};

/*
 * 数万回ループ処理など、重い処理を yield で分割実行する。
 */
async.splitExecuter = function async_splitExecuter(it, loopTimes, callback, finishCallback) {
    let count = 0;
    loopTimes++;

    let totalLoop = 0;
    let iterator = Iterator(it);
    let generator = (function() {
        yield true;
        while (true) {
            if (++count % loopTimes) {
                try {
                    let n = iterator.next();
                    callback.call(this, n, totalLoop);
                } catch (e if e instanceof StopIteration) {
                    if (typeof finishCallback == 'function')
                        finishCallback(totalLoop);
                    yield false;
                }
                totalLoop++;
            } else {
                count = 0;
                yield true;
            }
        }
    })();

    let looping = function() {
        if (generator.next()) {
            setTimeout(looping, 0);
        } else {
            generator.close();
        }
    }
    looping();
    return generator;
}
/*
 * end async
 */

/*
 * net
 */
var net = {};

net.makeQuery =  function net_makeQuery (data) {
    let pairs = [];
    let regexp = /%20/g;
    for (let k in data) {
        if (typeof data[k] == 'undefined') continue;
        let v = data[k].toString();
        let pair = encodeURIComponent(k).replace(regexp,'+') + '=' +
            encodeURIComponent(v).replace(regexp,'+');
        pairs.push(pair);
    }
    return pairs.join('&');
}

net._http = function net__http (url, callback, errorback, sync, query, method) {
    let xhr = new XMLHttpRequest();
    if (!sync) {
       xhr.onreadystatechange = function() {
           if (xhr.readyState == 4) {
               if (xhr.status == 200) {
                   callback(xhr);
               } else {
                   if (typeof errorback == 'function')
                       errorback(xhr);
               }
           }
       }
    }
    if (method == 'GET')
        url += this.makeQuery(query);
    xhr.open(method, url, sync);

    if (method == 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(this.makeQuery(query));
    } else {
        xhr.send(null);
        callback(xhr);
    }
    return xhr;
}

net.get = function net_get (url, callback, errorback, sync, query)
                this._http(url, callback, errorback, sync, query, 'GET');

net.post = function net_get (url, callback, errorback, sync, query)
                this._http(url, callback, errorback, sync, query, 'POST');



