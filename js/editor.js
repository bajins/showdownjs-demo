window.onload = function () {

  //Check if AngularJs and Showdown is defined and only load ng-Showdown if both are present
  if (typeof angular !== 'undefined' && typeof showdown !== 'undefined') {
    (function (module, showdown) {
      'use strict';

      module
        .provider('$showdown', ngShowdown)
        .directive('sdModelToHtml', ['$showdown', '$sanitize', '$sce', sdModelToHtmlDirective]) //<-- DEPRECATED: will be removed in the next major version release
        .directive('markdownToHtml', ['$showdown', '$sanitize', '$sce', markdownToHtmlDirective])
        .filter('sdStripHtml', ['$showdown', stripHtmlFilter]) //<-- DEPRECATED: will be removed in the next major version release
        .filter('stripHtml', ['$showdown', stripHtmlFilter]);

      /**
       * Angular Provider
       * Enables configuration of showdown via angular.config and Dependency Injection into controllers, views
       * directives, etc... This assures the directives and filters provided by the library itself stay consistent
       * with the user configurations.
       * If the user wants to use a different configuration in a determined context, he can use the "classic" Showdown
       * object instead.
       */
      function ngShowdown() {

        // Configuration parameters for Showdown
        var config = {
          extensions: [],
          sanitize: false
        };

        /**
         * Sets a configuration option
         *
         * @param {string} key Config parameter key
         * @param {string} value Config parameter value
         */
        /* jshint validthis: true */
        this.setOption = function (key, value) {
          config[key] = value;
          return this;
        };

        /**
         * Gets the value of the configuration parameter specified by key
         *
         * @param {string} key The config parameter key
         * @returns {string|null} Returns the value of the config parameter. (or null if the config parameter is not set)
         */
        this.getOption = function (key) {
          if (config.hasOwnProperty(key)) {
            return config[key];
          } else {
            return undefined;
          }
        };

        /**
         * Loads a Showdown Extension
         *
         * @param {string} extensionName The name of the extension to load
         */
        this.loadExtension = function (extensionName) {
          config.extensions.push(extensionName);

          return this;
        };

        function SDObject() {
          var converter = new showdown.Converter(config);

          /**
           * Converts a markdown text into HTML
           *
           * @param {string} markdown The markdown string to be converted to HTML
           * @returns {string} The converted HTML
           */
          this.makeHtml = function (markdown) {
            return converter.makeHtml(markdown);
          };

          /**
           * Strips a text of it's HTML tags. See http://stackoverflow.com/questions/17289448/angularjs-to-output-plain-text-instead-of-html
           *
           * @param {string} text
           * @returns {string}
           */
          this.stripHtml = function (text) {
            return String(text).replace(/<[^>]+>/gm, '');
          };

          /**
           * Gets the value of the configuration parameter of CONVERTER specified by key
           * @param {string} key The config parameter key
           * @returns {*}
           */
          this.getOption = function (key) {
            return converter.getOption(key);
          };

          /**
           * Gets the converter configuration params
           * @returns {*}
           */
          this.getOptions = function () {
            return converter.getOptions();
          };

          /**
           * Sets a configuration option
           *
           * @param {string} key Config parameter key
           * @param {string} value Config parameter value
           * @returns {SDObject}
           */
          this.setOption = function (key, value) {
            converter.setOption(key, value);
            return this;
          };

          /**
           * Get showdown's default options
           *
           * @param simple
           */
          this.getDefaultOptions = function(simple) {
            if (typeof showdown.getDefaultOptions !== 'undefined') {
              return showdown.getDefaultOptions(simple);
            } else {
              return null;
            }

          }
        }

        // The object returned by service provider
        this.$get = function () {
          return new SDObject();
        };
      }

      /**
       * @deprecated
       * Legacy AngularJS Directive to Md to HTML transformation
       *
       * Usage example:
       * <div sd-model-to-html="markdownText" ></div>
       *
       * @param {showdown.Converter} $showdown
       * @param {$sanitize} $sanitize
       * @param {$sce} $sce
       * @returns {*}
       */
      function sdModelToHtmlDirective($showdown, $sanitize, $sce) {
        return {
          restrict: 'A',
          link: getLinkFn($showdown, $sanitize, $sce),
          scope: {
            model: '=sdModelToHtml'
          },
          template: '<div ng-bind-html="trustedHtml"></div>'
        };
      }

      /**
       * AngularJS Directive to Md to HTML transformation
       *
       * Usage example:
       * <div markdown-to-html="markdownText" ></div>
       *
       * @param {showdown.Converter} $showdown
       * @param {$sanitize} $sanitize
       * @param {$sce} $sce
       * @returns {*}
       */
      function markdownToHtmlDirective($showdown, $sanitize, $sce) {
        return {
          restrict: 'A',
          link: getLinkFn($showdown, $sanitize, $sce),
          scope: {
            model: '=markdownToHtml'
          },
          template: '<div ng-bind-html="trustedHtml"></div>'
        };
      }

      function getLinkFn($showdown, $sanitize, $sce) {
        return function (scope, element, attrs) {
          scope.$watch('model', function (newValue) {
            var showdownHTML;
            if (typeof newValue === 'string') {
              showdownHTML = $showdown.makeHtml(newValue);
              //scope.trustedHtml = ($showdown.getOption('sanitize')) ? $sanitize(showdownHTML) : $sce.trustAsHtml(showdownHTML);
              scope.trustedHtml = showdownHTML;
              
            } else {
              scope.trustedHtml = typeof newValue;
            }
          });
        };
      }

      /**
       * AngularJS Filter to Strip HTML tags from text
       *
       * @returns {Function}
       */
      function stripHtmlFilter($showdown) {
        return function (text) {
          return $showdown.stripHtml(text);
        };
      }

    })(angular.module('ng-showdown', ['ngSanitize']), showdown);

  } else {
    document.cookie = 'version=develop';
    throw new Error('ng-showdown was not loaded because one of its dependencies (AngularJS or Showdown) was not met');
  }


  var app = angular.module('showdown.editor', ['ng-showdown', 'pageslide-directive', 'ngAnimate', 'ngRoute', 'ngCookies', 'ngSanitize']);

  
  app.controller('editorCtrl', ['$scope', '$showdown', '$http', '$cookies', '$sanitize', function ($scope, $showdown, $http, $cookies, $sanitize) {

    $scope.versions = ['develop', 'master'];
    $scope.version = $cookies.get('version') || 'develop';
    $scope.showModal = false;
    $scope.hashTxt = '';
    $scope.checked = false;
    $scope.firstLoad = true;
    $scope.text = '';
    $scope.checkOpts = [];
    $scope.numOpts = [];
    $scope.textOpts = [];

    var text = '';
    var savedCheckOpts = $cookies.getObject('checkOpts') || [];
    var savedNumOpts = $cookies.getObject('numOpts') || [];
    var savedTextOpts = $cookies.getObject('textOpts') || [];
    var defaultOpts = $showdown.getDefaultOptions(false);
    var checkOpts = {
      'omitExtraWLInCodeBlocks': true,
      'noHeaderId': false,
      'parseImgDimensions': true,
      'simplifiedAutoLink': true,
      'literalMidWordUnderscores': true,
      'strikethrough': true,
      'tables': true,
      'tablesHeaderId': false,
      'ghCodeBlocks': true,
      'tasklists': true,
      'smoothLivePreview': true,
      'prefixHeaderId': false,
      'disableForced4SpacesIndentedSublists': false,
      'ghCompatibleHeaderId': true,
      'smartIndentationFix': false
    };
    var numOpts = {
      'headerLevelStart': 3
    };
    var textOpts = {};

    if (defaultOpts !== null) {
      for (var opt in defaultOpts) {
        if (defaultOpts.hasOwnProperty(opt)) {
          var nOpt = (defaultOpts[opt].hasOwnProperty('defaultValue')) ? defaultOpts[opt].defaultValue : true;
          if (defaultOpts[opt].type === 'boolean') {
            if (!checkOpts.hasOwnProperty(opt)) {
              checkOpts[opt] = nOpt;
            }
          } else if (defaultOpts[opt].type === 'integer') {
            if (!numOpts.hasOwnProperty(opt)) {
              numOpts[opt] = nOpt;
            }
          } else {
            if (!textOpts.hasOwnProperty(opt)) {
              // fix bug in showdown's older version that specifies 'ghCompatibleHeaderId' as a string instead of boolean
              if (opt === 'ghCompatibleHeaderId') {
                continue;
              }
              if (!nOpt) {
                nOpt = '';
              }
              textOpts[opt] = nOpt;
            }
          }
        }
      }
    }

    for (opt in checkOpts) {
      if (checkOpts.hasOwnProperty(opt)) {
        $scope.checkOpts.push({name: opt, value: checkOpts[opt]});
      }
    }

    for (opt in numOpts) {
      if (numOpts.hasOwnProperty(opt)) {
        $scope.numOpts.push({name: opt, value: numOpts[opt]});
      }
    }

    for (opt in textOpts) {
      if (textOpts.hasOwnProperty(opt)) {
        $scope.textOpts.push({name: opt, value: textOpts[opt]});
      }
    }

    for (var i = 0; i < $scope.checkOpts.length; ++i) {
		for (var ii = 0; ii < savedCheckOpts.length; ++ii) {
			if ($scope.checkOpts[i].name === savedCheckOpts[ii].name) {
				$scope.checkOpts[i].value = savedCheckOpts[ii].value;
				break;
			}
		}
	}

    for (i = 0; i < $scope.numOpts.length; ++i) {
      for (ii = 0; ii < savedNumOpts.length; ++ii) {
        if ($scope.numOpts[i].name === savedNumOpts[ii].name) {
          $scope.numOpts[i].value = savedNumOpts[ii].value;
          break;
        }
      }
    }

    for (i = 0; i < $scope.textOpts.length; ++i) {
      for (ii = 0; ii < savedTextOpts.length; ++ii) {
        if ($scope.textOpts[i].name === savedTextOpts[ii].name) {
          $scope.textOpts[i].value = savedTextOpts[ii].value;
          break;
        }
      }
    }

    $scope.toggleMenu = function () {
      $scope.firstLoad = false;
      $scope.checked = !$scope.checked;
    };

    $scope.getHash = function () {
      $scope.hashTxt = document.location.origin + document.location.pathname + '#!/' + encodeURIComponent($scope.text);
      $scope.showModal = true;
    };

    $scope.toCleanRead = function () {
      // 1. 获取目标元素
      const original = document.getElementsByTagName("html");
      processHtmlElements(original[0]);
    }

    $scope.newTabPreview = function () {
        // 1. 获取目标元素
        const original = document.getElementsByTagName("html");

        // 2. 克隆该元素（包括其所有子节点）
        const clone = original[0].cloneNode(true);

        processHtmlElements(clone);

        // 5. 创建一个新的 HTML 字符串
        const newHTML = clone.outerHTML;

        // 6. 打开新标签页，并写入内容
        // const newWindow = window.open("", "_blank");
        // newWindow.document.write(newHTML);
        // newWindow.document.close(); // 必须调用 close() 才能完成渲染

        // --- 步骤 6: 在新标签页中打开 ---
        const blob = new Blob([newHTML], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        
        const newTab = window.open(url, '_blank');

        // 好的做法是，在新标签页加载后释放URL对象，但因为无法轻易监听加载完成事件，
        // 我们可以延迟释放，或者在某些场景下依赖浏览器在标签关闭时自动回收。
        // 对于这里，不立即释放也通常没问题。
        window.URL.revokeObjectURL(url);
    };

    $scope.toPdfMake = function () {

      const element = document.getElementById('preview');
      // 获取HTML内容
      const htmlContent = element.outerHTML;

      // 1. 设置中文字体
      // pdfmake 默认不支持中文，需要配置字体。
      pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          },
          // https://github.com/pdfmake/vfs-builders
          // https://jsfiddle.net/w0oL4zcb/1/
          // https://github.com/adobe-fonts/source-han-sans
          // https://www.jsdelivr.com/github
          // 定义一个支持中文的字体
          SourceHanSansCN: {
            normal: 'https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-sans@release/Variable/TTF/Subset/SourceHanSansCN-VF.ttf',
            bold: 'https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-sans@release/Variable/TTF/Subset/SourceHanSansCN-VF.ttf',
          },
          // 定义一个支持中文的字体
          SourceHanSansCNVM: {
            normal: 'SourceHanSansCN-VF.ttf',
            bold: 'SourceHanSansCN-VF.ttf',
            italics: 'SourceHanSansCN-VF.ttf',
            bolditalics: 'SourceHanSansCN-VF.ttf'
          },
      };

      // 2. 使用 html-to-pdfmake 转换
      // https://github.com/Aymkdn/html-to-pdfmake
      const converted = htmlToPdfmake(htmlContent);
      // 分页符，让目录单独一页
      // converted.unshift({ text: '', pageBreak: 'after' });
      // 首先，放置 TOC 占位符
      // converted.unshift({
      //     toc: {
      //         title: { text: '目录', style: 'tocTitle' }
      //     }
      // });

      // 3. 调用函数来处理 content，添加 TOC 属性
      // 我们需要处理数组中 TOC 占位符之后的内容slice(2) 会获取从第三个元素开始的所有内容
      // markTocItems(converted);

      const docDefinition = {
          content: converted,
          // 4. (可选) 设置默认样式，确保中文显示
          defaultStyle: {
              font: 'SourceHanSansCNVM'
          }
      }
      // https://pdfmake.github.io/docs/0.1/getting-started/client-side/methods
      // 5. 创建并下载PDF
      const pdfKitDoc = pdfMake.createPdf(docDefinition);
      // 异步调用
      pdfKitDoc.getStream(undefined, (pdfKit) => {
        // 大纲/书签
        // https://pdfkit.org/docs/outline.html
        const outline = pdfKit.outline;

        // --- 核心：添加多级大纲 ---
                    
        // levelTrackers 用于存储每个级别（1-5）的最新大纲节点
        const levelTrackers = {};

        // 选取所有我们关心的标题标签
        const headers = element.querySelectorAll('h1, h2, h3, h4, h5');
        
        headers.forEach(header => {
            const title = header.innerText;
            const level = parseInt(header.tagName.substring(1), 10); // 从 'H2' 中获取数字 2
            // --- 寻找父节点 ---
            let parent = null;
            // 从当前级别的上一级开始，向上寻找存在的父节点
            for (let i = level - 1; i >= 2; i--) {
                if (levelTrackers[i]) {
                    parent = levelTrackers[i];
                    break;
                }
            }
            if (!parent) {
                // 如果没有找到父节点，则使用根节点
                parent = outline;
            }
            
            // --- 添加大纲节点 ---
            const newNode = parent.addItem(title);
            
            // --- 更新并清理跟踪器 ---
            // 1. 将当前节点存入跟踪器
            levelTrackers[level] = newNode;
            // 2. 清除所有更深层级的跟踪器，确保层级正确
            for (let i = level + 1; i <= 5; i++) {
                levelTrackers[i] = null;
            }
        });

        pdfKitDoc._flushDoc(pdfKit, function (buffer, pdfMakePages) {
          const blob = pdfKitDoc._bufferToBlob(buffer);
          // FileSaver.saveAs(blob, "markdown.pdf");
          const options = {};
          options.autoPrint = false;
          const urlCreator = window.URL || window.webkitURL;
          const pdfUrl = urlCreator.createObjectURL(blob);
          pdfKitDoc._openWindow().location.href = pdfUrl;
        });
      });
      // pdfKitDoc.open();
      // pdfKitDoc.download('pdfmake-example.pdf');
        
    };

    $scope.toJsPDF = function () {
      // 1. 获取目标元素
      const original = document.getElementsByTagName("html");

      // 2. 克隆该元素（包括其所有子节点）
      const clone = original[0].cloneNode(true);

      // 3. 删除某些子元素（例如 class 为 remove-me 的元素）
      clone.querySelector("body > div.lateral-menu.ng-isolate-scope.ng-pageslide").remove();
      clone.querySelector("body > nav").remove()
      clone.querySelector("#editor").remove()
      // 4. 调整某些子节点的样式
      const ew = clone.querySelector("#editor-wrapper");
      ew.style.width="unset";
      ew.style.paddingTop="unset";
      const pv = clone.querySelector("#preview");
      pv.style.width="unset";
      pv.style.overflowY="unset";
      const pvd = clone.querySelector("#preview > div");
      pvd.style.paddingBottom="20px";
      clone.querySelector("body").style.fontFamily = 'SourceHanSansCN-VF';

       // 获取HTML内容
      const element = clone;
      element.style.fontFamily = 'SourceHanSansCN-VF';

      // https://github.com/parallax/jsPDF
      // https://github.com/niklasvh/html2canvas
      // https://github.com/yorickshan/html2canvas-pro
      const { jsPDF } = window.jspdf;

      // const jsPDF = window.jspdf.jsPDF;
      // const html2canvas = window.html2canvas;

      /*var callAddFont = function () {
          this.addFileToVFS('SourceHanSansCN-VF-normal.ttf', shscn_font);
          this.addFont('SourceHanSansCN-VF-normal.ttf', 'SourceHanSansCN-VF', 'normal');
      };
      jsPDF.API.events.push(['addFonts', callAddFont])*/

      // 'p' (portrait) 代表纵向, 'pt' 代表单位 "points", 'a4' 代表 A4 纸张
      // const pdf = new jsPDF('p', 'pt', 'a4');
      const bounds = element.getBoundingClientRect();
      const correctOrientation = bounds.height > bounds.width ? 'p' : 'l';
      const pdf = new jsPDF({
        putOnlyUsedFonts: true,
        // format: [bounds.height + 100, bounds.width],
        unit: 'pt',
        orientation: correctOrientation,
        format: "a4"
      });
      // https://github.com/parallax/jsPDF/issues/2968
      // https://peckconsulting.s3.amazonaws.com/fontconverter/fontconverter.html
      // https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
      // https://raw.githack.com
      // https://products.aspose.app/font/zh/base64/ttf
      pdf.addFileToVFS('SourceHanSansCN-VF-normal.ttf', shscn_font);
      pdf.addFont('SourceHanSansCN-VF-normal.ttf', 'SourceHanSansCN-VF', 'normal');
      pdf.setFont('SourceHanSansCN-VF', 'normal');
      console.log(pdf.getFont());
      
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usablePageHeight = pageHeight-20-20;

      pdf.html(element, {
        jsPDF: pdf,
        x: 20,
        y: 20,
        width: 565, // A4 纸张宽度约为 595pt，减去边距
        // width: pdf.internal.pageSize.getWidth(),
        margin: [0, 0, 0, 0],
        autoPaging: 'text',// 自动分页策略
        hotfixes: ["px_scaling"],
        /*fontFaces: [
            {
                family: 'SourceHanSansCN-VF',
                src: [
                    {
                        url: 'https://cdn.jsdelivr.net/gh/adobe-fonts/source-han-sans@release/Variable/TTF/Subset/SourceHanSansCN-VF.ttf',
                        format: 'truetype'
                    }
                ]
            }
        ],*/
        windowWidth: 800, // 指定html2canvas截图的窗口宽度，应与元素宽度匹配
        html2canvas: {
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          scale: 1,
        },
        // callback: resolve,
        callback: (pfd) => {
          console.log(pfd.getFontList(), pfd.getFont(), 'callback');

          // --- 核心：添加多级大纲 ---
          const outline = pdf.outline;
                    
          // levelTrackers 用于存储每个级别（1-5）的最新大纲节点
          const levelTrackers = {};

          // 选取所有我们关心的标题标签
          const headers = element.querySelectorAll('h1, h2, h3, h4, h5');
          
          headers.forEach(header => {
              const title = header.innerText;
              const level = parseInt(header.tagName.substring(1), 10); // 从 'H2' 中获取数字 2
              
              // --- 动态估算页码 ---
              // 获取元素相对于 #contentToPrint 的顶部偏移量
              const offsetTop = header.offsetTop; 
              // 估算页码。这是一个简化模型，实际分页可能因内容断行而异
              const pageNumber = Math.floor(offsetTop / usablePageHeight) + 1;

              // --- 寻找父节点 ---
              let parent = null;
              // 从当前级别的上一级开始，向上寻找存在的父节点
              for (let i = level - 1; i >= 2; i--) {
                  if (levelTrackers[i]) {
                      parent = levelTrackers[i];
                      break;
                  }
              }
              
              // --- 添加大纲节点 ---
              const newNode = outline.add(parent, title, { pageNumber: pageNumber });
              
              // --- 更新并清理跟踪器 ---
              // 1. 将当前节点存入跟踪器
              levelTrackers[level] = newNode;
              // 2. 清除所有更深层级的跟踪器，确保层级正确
              for (let i = level + 1; i <= 5; i++) {
                  levelTrackers[i] = null;
              }
          });
          
          // pfd.output('dataurlnewwindow');
          window.open(pdf.output('bloburl'));
          /*const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.click();*/

          // pdf.save("xx.pdf");
        },
      });

    };


    $scope.toHtml2pdf = function () {
      // 1. 获取目标元素
      const original = document.getElementsByTagName("html");

      // 2. 克隆该元素（包括其所有子节点）
      const clone = original[0].cloneNode(true);

      // 3. 删除某些子元素（例如 class 为 remove-me 的元素）
      clone.querySelector("body > div.lateral-menu.ng-isolate-scope.ng-pageslide").remove();
      clone.querySelector("body > nav").remove()
      clone.querySelector("#editor").remove()
      // 4. 调整某些子节点的样式
      const ew = clone.querySelector("#editor-wrapper");
      ew.style.width="unset";
      ew.style.paddingTop="unset";
      const pv = clone.querySelector("#preview");
      pv.style.width="unset";
      pv.style.overflowY="unset";
      const pvd = clone.querySelector("#preview > div");
      pvd.style.paddingBottom="20px";

      var opt = {
        margin:       1,
        filename:     'myfile.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 3 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
        enableLinks:  true,
        pdfCallback: function(pdf) {
          // pdf.autoPrint();
        }
      };

      // New Promise-based usage:
      html2pdf().set(opt).from(clone)
      .toContainer()
      .toCanvas()
      .toPdf()
      /*.output('datauristring').then(function (pdfAsString) {
          console.log(pdfAsString);
      })*/
      .get('pdf').then((pdf) => {
        console.log(pdf.getFontList(), pdf.getFont(), 'callback');

        // --- 核心：添加多级大纲 ---
        const outline = pdf.outline;
                  
        // levelTrackers 用于存储每个级别（1-5）的最新大纲节点
        const levelTrackers = {};

        // 选取所有我们关心的标题标签
        const headers = clone.querySelectorAll('h1, h2, h3, h4, h5');
        
        headers.forEach(header => {
            const title = header.innerText;
            const level = parseInt(header.tagName.substring(1), 10); // 从 'H2' 中获取数字 2
            
            // --- 动态估算页码 ---
            // 获取元素相对于 #contentToPrint 的顶部偏移量
            const offsetTop = header.offsetTop; 
            // 估算页码。这是一个简化模型，实际分页可能因内容断行而异
            const pageNumber = Math.floor(offsetTop / pdf.internal.pageSize.getHeight()) + 1;

            // --- 寻找父节点 ---
            let parent = null;
            // 从当前级别的上一级开始，向上寻找存在的父节点
            for (let i = level - 1; i >= 2; i--) {
                if (levelTrackers[i]) {
                    parent = levelTrackers[i];
                    break;
                }
            }
            
            // --- 添加大纲节点 ---
            const newNode = outline.add(parent, title, { pageNumber: pageNumber });
            
            // --- 更新并清理跟踪器 ---
            // 1. 将当前节点存入跟踪器
            levelTrackers[level] = newNode;
            // 2. 清除所有更深层级的跟踪器，确保层级正确
            for (let i = level + 1; i <= 5; i++) {
                levelTrackers[i] = null;
            }
        });


        window.open(pdf.output('bloburl'));
        /*const link = document.createElement('a');
        link.target = '_blank';
        link.href = pdf.output('bloburl');
        link.download = 'FileName';
        link.click();
        link.remove();*/
      })
      // .save();
      .catch(function (error) {
        console.log(error);
      });
    };

    $scope.closeModal = function () {
      $scope.showModal = false;
    };

    $scope.loadVersion = function () {
      $cookies.put('version', $scope.version);
      sessionStorage.setItem("text", $scope.text);
      location.reload();
    };

    $scope.updateOptions = function () {
      for (var i = 0; i < $scope.checkOpts.length; ++i) {
        $showdown.setOption($scope.checkOpts[i].name, $scope.checkOpts[i].value);
      }

      for (i = 0; i < $scope.numOpts.length; ++i) {
        if ($scope.numOpts[i].name === 'headerLevelStart') {
          if (isNaN($scope.numOpts[i].value) || $scope.numOpts[i].value < 1) {
            $scope.numOpts[i].value = 1;
          } else if ($scope.numOpts[i].value > 6) {
            $scope.numOpts[i].value = 6;
          }
        }
        $showdown.setOption($scope.numOpts[i].name, $scope.numOpts[i].value);
      }

      for (i = 0; i < $scope.textOpts.length; ++i) {
        $showdown.setOption($scope.textOpts[i].name, $scope.textOpts[i].value);
      }

      $cookies.putObject('checkOpts', $scope.checkOpts);
      $cookies.putObject('numOpts', $scope.numOpts);
      $cookies.putObject('textOpts', $scope.textOpts);
    };

    $scope.repaint = function () {
      sessionStorage.setItem("text", $scope.text);
      console.log($cookies.getAll()); // this is to force cookies to update
      location.reload();
    };

    //load available versions
    $http.get('https://api.github.com/repos/showdownjs/showdown/releases')
      .then(
      function (response) {
        for (var i = 0; i < response.data.length; ++i) {
          if (compareVersions(response.data[i].tag_name, '1.0.0') >= 0) {
            $scope.versions.push(response.data[i].tag_name);
          }
        }
      },
      function (error) {
        console.error('Error retrieving versions', error);
      }
    );

    $scope.updateOptions(false);

    // get text from URL or load the default text
    if (window.location.hash) {
      var hashText = window.location.hash.replace(/^#!(\/)?/, '');
      console.log(window.location.hash, hashText);
      hashText = decodeURIComponent(hashText);
      $scope.text = hashText;
    } else if (sessionStorage.getItem('text')) {
      $scope.text = sessionStorage.getItem('text');
    } else {
      var defHtml = $http.get('md/text.md');
      defHtml
        .then(function(res) {
          $scope.text = res.data;
          return $http.get('//raw.githubusercontent.com/wiki/showdownjs/showdown/Showdown\'s-Markdown-syntax.md');
        })
        .then(function(res) {
          $scope.text = $scope.text + '\n\n' + res.data;
        })
        .catch(function (error) {
          $scope.text = '';
          console.log(error);
        });
      }
  }]);

  angular.bootstrap(document, ['showdown.editor']);
};
