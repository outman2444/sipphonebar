/**
 * phonebar 构造函数
 * @param seatName
 * @param seatPass
 * @param serverHost
 */
function phonebar(seatName, seatPass, serverHost) {
    this.seatName = seatName;
    this.seatPass = seatPass;
    this.serverHost = serverHost;
    this.sipsession = null;
    this.currentStatus = 0;
    this.statusEnum = {
        unregister: {index: 0, text: "未注冊"},
        registed: {index: 1, text: "空闲"},
        dialing: {index: 2, text: "呼叫中"},
        calling: {index: 3, text: "通話中"},
    }
}


/**
 * phone 初始化
 * @param phonebardom
 * @param ajaxInfo
 * @param listener
 * @param exportInfo
 * 1. 获取号码
 * 2. 创建坐席对象
 * 3. 渲染dom
 * 4. 添加监听事件
 */
phonebar.prototype.init = function (phonebardom = {
    "dom": 'workbench',
    "width": '280px',
    "height": '550px',
    html: ""
}, ajaxInfo = {
    ajaxHost: "localhost:9102",
    ajaxMethod: "post",
    ajaxHeaders: {
        token: $.cookie("token")
    }
}, listener = {
    onRegistered: null,
    onCallComing: null,
    onCallDialing: null,
    onStatusChange: null,
    onCallEstablish: null,
    onHangUp: null,
}, exportInfo = {
    debug: false
}) {

    var _this = this;
    _this.listener = listener;
    _this.exportInfo = exportInfo;
    _this.ajaxInfo = ajaxInfo;

    _this.logger("软电话初始化开始")

    // 渲染软电话条
    document.getElementById(phonebardom.dom).html = phonebardom.html
    document.getElementById(phonebardom.dom).style.width = phonebardom.width
    document.getElementById(phonebardom.dom).style.height = phonebardom.height


    // 获取媒体对象
    _this.media = document.getElementById('phonebarmedia');

    // TODO 1. 获取号码
    _this.phoneNumberList = [
        {
            phoneNumber: "9573288",
            phoneNumberMark: "ls95",
        },
        // {
        //     phoneNumber: "02131264814",
        //     phoneNumberMark: "gt14",
        // },
        // {
        //     phoneNumber: "02131264815",
        //     phoneNumberMark: "gt15",
        // }
    ]

    // 初始化坐席
    var config = {
        uri: 'sip:' + _this.seatName + "@" + _this.serverHost + ":5160",
        transportOptions: {
            wsServers: ['ws://' + _this.serverHost + ':5066']
        },
        authorizationUser: _this.seatName,
        password: _this.seatPass,
        log: !_this.exportInfo.debug,
        erizoController: {
            iceServers: [{'url': 'stun:stun.xten.com:3478'},
                {'url': 'stun:stun.voiparound.com:3478'},
                {'url': 'stun:numb.viagenie.ca:3478'},
                {'url': 'stun:stun.bcs2005.net:3478'},
                {'url': 'stun:stun.voip.aebc.com:3478'},]
        }
    };
    _this.logger(config)
    _this.userAgent = new SIP.UA(config);

    // 监听坐席注册成功事件
    _this.userAgent.on('registered', function () {
        _this.logger("注册成功")
        _this.seatStatusUpdate(_this.statusEnum.registed);

        // 勾起 自定义的 注册成功事件
        _this.execut(listener.onRegistered)
    });

    // 监听坐席来电事件
    _this.userAgent.on('invite', function (session) {
        _this.sipsession = session;

        _this.mediaPlay({
            media: _this.media,
            loop: "loop",
            src: "./sounds/call_ring.wav"
        })

        // 呼叫url
        var url = session.remoteIdentity.uri.toString();
        // 呼入号码
        var callInPhoneNumber = url.split(":")[1].split("@")[0]
        // 呼入提示信息
        var callInMsg = callInPhoneNumber + "来电 ..."

        // 勾起 自定义的 来电事件
        _this.execut(listener.onCallComing);

        // 提示坐席接听
        var isaccept = confirm(callInMsg);
        if (isaccept) {
            _this.seatStatusUpdate(_this.statusEnum.calling)
            //接受来电
            session.accept({
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                }
            });

            // 勾起 自定义的  接通事件
            _this.execut(listener.onCallDialing);

            // 监听sipsession 事件
            _this.sipSessionListener(listener);
        } else {
            //拒绝来电
            session.reject();
        }
    });
    _this.logger("软电话初始化结束")
}

/**
 * sip session 事件监听
 */
phonebar.prototype.sipSessionListener = function () {
    var _this = this;
    // 监听 通话接通事件
    _this.sipsession.on('accepted', function (data) {
        // 勾起 自定义的 通话建立事件
        _this.execut(_this.listener.onCallEstablish)

        _this.seatStatusUpdate(_this.statusEnum.calling)

        var pc = _this.sipsession.sessionDescriptionHandler.peerConnection;

        // 播放媒体流
        var remoteStream = new MediaStream();
        pc.getReceivers().forEach(function (receiver) {
            remoteStream.addTrack(receiver.track);
        });
        // 播放媒体流
        _this.mediaPlay({
            media: _this.media,
            srcObject: remoteStream
        })
    });

    // 监听通话拒绝事件
    _this.sipsession.on("rejected", function (response, cause) {
        _this.logger("通话拒绝")
        _this.logger(response)
        _this.logger(cause)

        if (response.reasonPhrase == 'Internal Server Error') {
            // 用户拒接
            // 播放媒体流
            _this.mediaPlay({
                media: _this.media,
                src: "./sounds/diy_user_busy.wav"
            })
        }

    })

    // 监听通话失败事件
    _this.sipsession.on("failed", function () {
        _this.logger("通话失败")
    })

    // 监听通话取消事件
    _this.sipsession.on("cancel", function () {
        _this.logger("通话取消")
    })

    // 监听通话结束事件    rejectedand failed或bye  cancel 后触发
    _this.sipsession.on("terminated", function (message, cause) {
        _this.logger("通话结束，message：" + message + "\ncause：" + cause)
        _this.seatStatusUpdate(_this.statusEnum.registed)

        // 勾起 自定义的  通话结束事件
        _this.execut(_this.listener.onHangUp)
    })

    // 监听通话所有事件
    _this.sipsession.on("progress", function (response) {
        _this.logger("通话响应：")
        _this.logger(response)
    })
}


/**
 * 外呼拨号
 * @param callOutPhoneNumber
 * @returns {boolean}
 */
phonebar.prototype.call = function (callOutPhoneNumber) {
    var _this = this

    if (_this.currentStatus.index != _this.statusEnum.registed.index) {
        return false;
    }

    if (typeof(callOutPhoneNumber) == "undefined") {
        _this.logger("软电话外呼")
        callOutPhoneNumber = document.getElementById('callout-input').value;
    } else {
        // 将外呼号码赋值到输入框中
        document.getElementById('callout-input').value(callOutPhoneNumber)
    }

    // 获取使用的外呼号码
    var random = Math.floor(Math.random() * _this.phoneNumberList.length);
    var phoneNumberInfo = _this.phoneNumberList[random];
    var phoneNumber = phoneNumberInfo.phoneNumber
    var phoneNumberMark = phoneNumberInfo.phoneNumberMark

    // 校验号码
    if (callOutPhoneNumber.length != 11) {
        alert("号码【" + callOutPhoneNumber + "】不正确");
        return false;
    }

    // 拼接号码
    callOutPhoneNumber = "sip:" + phoneNumberMark + callOutPhoneNumber + "@" + _this.serverHost;
    _this.logger("呼叫号码：" + callOutPhoneNumber)

    // 修改呼叫状态为呼叫中  并播放等待音乐
    _this.seatStatusUpdate(_this.statusEnum.dialing)
    _this.mediaPlay({
        media: _this.media,
        loop: "loop",
        src: "./sounds/call_ring.wav"
    })

    _this.sipsession = _this.userAgent.invite(callOutPhoneNumber, {
        sessionDescriptionHandlerOptions: {
            constraints: {
                audio: true, video: false
            }
        }
    });

    // 开始监听session 事件
    _this.sipSessionListener();
}


/**
 * 挂断电话
 */
phonebar.prototype.gua = function () {
    this.seatStatusUpdate(this.statusEnum.registed)
    this.sipsession.terminate();
    this.mediaPlay()
}

/**
 * 播放媒体流
 */
phonebar.prototype.mediaPlay = function (mediaInfo = {
    loop: "",
    src: "",
    srcObject: null
}) {
    this.media.loop = mediaInfo.loop
    if (mediaInfo.srcObject) {
        this.media.srcObject = mediaInfo.srcObject;
    } else {
        this.media.src = mediaInfo.src;
    }
    this.media.play();
}

/**
 * 坐席状态更改
 */
phonebar.prototype.seatStatusUpdate = function (statusInfo) {
    var _this = this

    _this.logger("更新状态为-->" + statusInfo.text)
    // 更新坐席状态
    document.getElementById('seatStatusText').innerText = statusInfo.text;
    _this.currentStatus = statusInfo;

    // 记录当前时间
    var now = new Date();
    sessionStorage.setItem("statUpdateDate", now);

    // 开始计时
    setInterval(function () {
        clock();
    }, 1000)
    // 勾起自定义的 坐席状态改变时间
    _this.execut(_this.listener.onStatusChange)
}

/**
 * 执行指定方法
 * @param fnc
 */
phonebar.prototype.execut = function (fnc) {
    if (fnc) {
        fnc();
    }
}

phonebar.prototype.logger = function (obj) {
    var _this = this
    if (_this.exportInfo.debug) {
        console.log(obj)
    }
}