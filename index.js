var gulp = require('gulp');
var path = require('path');
var spritesmith = require('spritesmith');
var fs = require('fs');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var notify = require('gulp-notify');
var request = require('request');
var log = require('npmlog');
var Promise = require('es6-promise').Promise;

var srcPath    = {
      HTML : "./src/*.html",
      LESS : "./src/less/*.less",
      CSS : "./src/css",
      JS : ["./src/js/*.js","!./src/js/*min.js"],
      IMG : "./src/images",
      SPRITE: "./src/images/slice",
      LIB : "./src/lib"
    };
var distPath   = {
      ROOT : "./build",
      CSS : "./build/css",
      JS : "./build/js",
      IMG : "./build/images"
    };


module.exports = function (spon) {

    /**
     * sprite
     */
    spon.cli
    .command('sprite [cmd]')
    .description('传统前端开发方案')
    .option("-m, --mobi [type]", "是否H5环境")
    .action(function(cmd, config){
      
      spriteTask(config);

    });

    function spriteTask (config) {
      var _isH5 = config.mobi;
      var outputPath = path.join(process.cwd(), 'sprite');

      fs.exists(outputPath, function (exists) {
        if (!exists) {
          return fs.mkdirSync(outputPath);
        }
      });

      var pngPathArr = (function () {
        var imgArr = fs.readdirSync(process.cwd());
      
        var pngArr = imgArr.filter(function (item, i) {
          return item.search(/\.png/gi) > -1;
        })

        var pngPathArr = pngArr.map(function (item, i) {
          return path.join(process.cwd(), item);
        })

        return pngPathArr;
      })();

      function postSpritePng() {
        return new Promise(function (resolve, reject) {
          log.info('start uploading sprite png')
          var formData = {

            file: fs.createReadStream(path.join(outputPath, 'sprite.png')),
            
          };
          request.post({url:'http://file.showjoy.com/saveFile/', formData: formData}, function optionalCallback(err, httpResponse, body) {
            if (err) {
              reject(new Error(err));
            } else {
              
              resolve(body);
            }
          });

        })
      }
      

      //压缩图片
      gulp.task('imagemin', function () {
         return gulp.src(path.join(outputPath, 'sprite.png'))
          .pipe(notify({message: 'starting imagemin!'}))
          .pipe(imagemin({
              progressive: true,
              svgoPlugins: [{removeViewBox: false}],
              use: [pngquant()] //深度png压缩
          }))
          .pipe(gulp.dest(outputPath))
          .pipe(notify({message: 'finished imagemin!'}));
      });

      var getCssString = function (coor, prop, imgPath) {
        var codeStr = '';
        for (key in coor) {
          var code = '"' + key + '" ' + '{' + '\n';
              code += 'background: ';
              code += 'url(' + imgPath + ') ';
              code += 'no-repeat;';
              code += '\n';
              code += 'background-position: -';
              code += (_isH5 !== undefined) ? coor[key].x / 2 : coor[key].x;
              code += 'px -';
              code += _isH5 ? coor[key].y / 2 : coor[key].y;
              code += 'px;';
              code += '\n';
              code += 'background-size: ';
              code += _isH5 ? prop.width / 2 : prop.width;
              code += 'px ';
              code += _isH5 ? prop.height / 2 : prop.height;
              code += 'px;';
              code += '\n';
              code += 'width: ';
              code += _isH5 ? coor[key].width / 2 : coor[key].width;
              code += 'px;';
              code += '\n';
              code += 'height: ';
              code += _isH5 ? coor[key].height / 2 : coor[key].height;
              code += 'px;';
              code += '\n';
              code += '}';
              code += '\n';
              codeStr += code;
        }
        return codeStr;
      }

      var makeSprite = function (cb) {
        spritesmith({src: pngPathArr}, function handleResult (err, result) {

          fs.writeFileSync(path.join(outputPath, 'sprite.png'), result.image);
          gulp.start('imagemin', function () {

            postSpritePng().then(function (body) {
              log.info('Upload successful!');
              var dataJson = JSON.parse(body);
              var cssstr = getCssString(result.coordinates, result.properties, dataJson.data.replace('file', 'cdn1'));
              cb(cssstr)
            }).catch(function (err) {
              log.error(err);
            })
          });
        });
      }

      // 最终调用makeSprite
      makeSprite(function (cssstr) {
        // 将css写入样式文件
        fs.writeFileSync(path.join(outputPath, 'sprite.css'), cssstr);
      })
    }
} 