/**
 * 更新 计时时间
 */
function clock() {
    var now = new Date();
    var stime = Date.parse(new Date(sessionStorage.getItem("statUpdateDate")));
    var etime = Date.parse(new Date(now));

    // 两个时间戳相差的毫秒数
    var usedTime = etime - stime;
    // 计算相差的天数
    var days = Math.floor(usedTime / (24 * 3600 * 1000));
    // 计算天数后剩余的毫秒数
    var leave1 = usedTime % (24 * 3600 * 1000);
    // 计算出小时数
    var hours = Math.floor(leave1 / (3600 * 1000));
    // 计算小时数后剩余的毫秒数
    var leave2 = leave1 % (3600 * 1000);
    // 计算相差分钟数
    var minutes = Math.floor(leave2 / (60 * 1000));
    // 计算分钟后剩余的毫秒数
    var leave3 = leave2 % (60 * 1000);
    // 计算相差秒数
    var send = Math.floor(leave3 / (1 * 1000));

    days = days < 10 ? "0" + days : days;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    send = send < 10 ? "0" + send : send;

    var time = days + ":" + hours + ":" + minutes + ":" + send;
    document.getElementById("peerTimeState").innerHTML = time;
}

function clientSideInclude(id, url) {
    var req = false;
    // Safari, Firefox, 及其他非微软浏览器
    if (window.XMLHttpRequest) {
        try {
            req = new XMLHttpRequest();
        } catch (e) {
            req = false;
        }
    } else if (window.ActiveXObject) {

        // For Internet Explorer on Windows
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                req = false;
            }
        }
    }
    var element = document.getElementById(id);
    if (!element) {
        alert("函数clientSideInclude无法找到id " + id + "。" +
            "你的网页中必须有一个含有这个id的div 或 span 标签。");
        return;
    }
    if (req) {
        // 同步请求，等待收到全部内容
        req.open('GET', url, false);
        req.send(null);
        if (req.status == 404) {
            clientSideInclude(id, 'error.html')
        } else {
            element.innerHTML = req.responseText;
        }
    } else {
        element.innerHTML =
            "对不起，你的浏览器不支持" +
            "XMLHTTPRequest 对象。这个网页的显示要求" +
            "Internet Explorer 5 以上版本, " +
            "或 Firefox 或 Safari 浏览器，也可能会有其他可兼容的浏览器存在。";
    }
}

