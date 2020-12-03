"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _require = require("loader-utils"),
    getOptions = _require.getOptions,
    urlToRequest = _require.urlToRequest;

var sax = require("sax");

var HTMLMinifier = require("html-minifier");

var ROOT_TAG_NAME = "xxx-wxml-root-xxx";
var ROOT_TAG_START = "<".concat(ROOT_TAG_NAME, ">");
var ROOT_TAG_END = "</".concat(ROOT_TAG_NAME, ">");
/**
 * interface collectedTags {
 *    [tagname: string]: {
 *        [attrname: string]: boolean;
 *    }
 * }
 */

var collectedTags = {};

var getCollectedTags = function getCollectedTags() {
  return {
    audio: {
      src: true,
      poster: true
    },
    "live-player": {
      src: true
    },
    "live-pusher": {
      "waiting-image": true
    },
    video: {
      src: true,
      poster: true
    },
    "cover-image": {
      src: true
    },
    image: {
      src: true
    },
    wxs: {
      src: true
    },
    "import": {
      src: true
    },
    include: {
      src: true
    }
  };
};
/**
 * 判断路径是否为本地静态路径
 * @param {string} _path
 * @return {string|null}
 */


var getValidLocalPath = function getValidLocalPath(_path) {
  // 不存在 ｜ 含有变量 ｜ 含有协议
  if (!_path || /\{\{/.test(_path) || /^(https?:)?\/\//.test(_path)) {
    return null;
  }

  return _path;
};
/**
 * 从标签中分析属性 收集本地资源路径数组
 * @param {object} node
 * @return {array}
 */


var getResourceRelativePaths = function getResourceRelativePaths(node) {
  var tagName = node.name,
      attributes = node.attributes;
  var curTagDict = collectedTags[tagName];
  var result = [];

  if (curTagDict) {
    Object.keys(curTagDict).forEach(function (attr) {
      if (attributes[attr] && curTagDict[attr]) {
        var val = getValidLocalPath(attributes[attr]);

        if (val) {
          result.push(val);
        }
      }
    });
  }

  return result;
};

var mergeCollectedTags = function mergeCollectedTags(defaultOpt, customOpt) {
  if (customOpt && (0, _typeof2["default"])(customOpt) === "object" && Object.keys(customOpt).length) {
    Object.keys(customOpt).forEach(function (tagname) {
      if (defaultOpt[tagname]) {
        defaultOpt[tagname] = _objectSpread(_objectSpread({}, defaultOpt[tagname]), customOpt[tagname]);
      } else {
        defaultOpt[tagname] = customOpt[tagname];
      }
    });
  }
};

var mergeMinimizeOpts = function mergeMinimizeOpts(customOpt) {
  return _objectSpread({
    // Treat attributes in case sensitive manner (useful for custom HTML tags)
    caseSensitive: true,
    // Collapse white space that contributes to text nodes in a document tree
    collapseWhitespace: true,
    // Always collapse to 1 space (never remove it entirely).
    conservativeCollapse: true,
    // Keep the trailing slash on singleton elements
    keepClosingSlash: true,
    // Strip HTML comments
    removeComments: true,
    // Remove all attributes with whitespace-only values
    removeEmptyAttributes: true,
    // Remove attributes when value matches default.
    removeRedundantAttributes: true,
    // Array of regex'es that allow to ignore certain fragments, when matched (e.g. <?php ... ?>, {{ ... }}, etc.)
    ignoreCustomFragments: [/{{[\s\S]*?}}/],
    preventAttributesEscaping: true
  }, customOpt);
};

function handleReq(_x) {
  return _handleReq.apply(this, arguments);
}
/**
 * 解析 wxml 收集并处理本地依赖
 * 收集的规则，包括内置规则和外部自定义配置的规则(todo)
 * @param {string} content
 */


function _handleReq() {
  _handleReq = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req) {
    var _this = this;

    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            this.addDependency(req);
            _context2.next = 3;
            return new Promise(function (resolve, reject) {
              _this.loadModule(req, function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            });

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _handleReq.apply(this, arguments);
}

module.exports = function wxmlLoader(content) {
  var that = this;
  that.cacheable();
  var requests = [];
  var callback = that.async();
  var options = getOptions(that) || {};
  var rootContext = that.rootContext;
  var parser = sax.parser(false, {
    lowercase: true
  });
  var reqHandler = handleReq.bind(that);
  collectedTags = getCollectedTags();
  mergeCollectedTags(collectedTags, options.collectedTags);
  var minimizeOpt;

  if (options.minimize) {
    var _c = options.minimize;
    minimizeOpt = mergeMinimizeOpts((0, _typeof2["default"])(_c) === "object" && !Array.isArray(_c) ? _c : {});
  } // an error happened.


  parser.onerror = function onParserError(e) {
    callback(e, content);
  }; // opened a tag. node has "name" and "attributes"


  parser.onopentag = function onParserOpenTag(node) {
    requests = requests.concat(getResourceRelativePaths(node).map(function (_path) {
      return urlToRequest(_path, rootContext);
    }));
  }; // parser stream is done, and ready to have more stuff written to it.


  parser.onend = /*#__PURE__*/function () {
    var _onParserEnd = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return Promise.all(requests.map(reqHandler));

            case 3:
              if (minimizeOpt) {
                content = HTMLMinifier.minify(content, minimizeOpt);
              }

              callback(null, content);
              _context.next = 10;
              break;

            case 7:
              _context.prev = 7;
              _context.t0 = _context["catch"](0);
              callback(_context.t0, content);

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 7]]);
    }));

    function onParserEnd() {
      return _onParserEnd.apply(this, arguments);
    }

    return onParserEnd;
  }();

  parser.write("".concat(ROOT_TAG_START).concat(content).concat(ROOT_TAG_END)).close();
};