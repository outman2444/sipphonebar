clientSideInclude("yihephonebar" , "phonebar.html")
initYiHeWorkbench()
function initYiHeWorkbench(html) {
    // 实例化 电话条
    var phonebar = new phonebar("tj", "1234", "101.132.226.25")

// dom 信息
    var phonebardom = {
        "dom": 'yihephonebar',
        "width": '500px',
        "height": '130px',
        "html": html
    }
    var ajaxInfo = {}
    var listener = {}
    var exportInfo = {debug: true}

// 初始化电话条
    phonebar.init(phonebardom, ajaxInfo, listener, exportInfo)

}
