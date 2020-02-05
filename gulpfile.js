const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const scp = require("gulp-scp2");

gulp.task("dev", () => {
  console.log(`[${new Date()}]: ready to develop!`);
  browserSync.init({
    server: {
      baseDir: "./dev",
      directory: true
    },
    // https: true,
    port: "8000",
    startPath: "./phonebar.html"
  });
});

gulp.task("help", () => {
  console.log(" -------------------------------- 说明开始 --------------------------------");
  console.log(" 运行npm run dev命令后，浏览器会自动打开项目页面，修改html、scss、js文件后页面将自动刷新");
  console.log(" gulp clean                      清空build目录下的文件");
  console.log(" gulp help                       显示帮助信息");
  console.log(" -------------------------------- 说明结束 --------------------------------");
});

gulp.task("deployTo235", () => {
  return gulp.src(["./dev/**/*"])
    .pipe(scp({
      host: "192.168.99.235",
      username: "yanbao",
      port: "10088",
      password: "ls3du8",
      readyTimeout: 60000,
      dest: "/home/yanbao/tomcat/hw_server/webapps"
    }))
    .on("error", e => {
      console.log(e);
    });
});
