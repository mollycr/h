/*
** Annotator 1.2.6-dev-f18c18d
** https://github.com/okfn/annotator/
**
** Copyright 2012 Aron Carroll, Rufus Pollock, and Nick Stenning.
** Dual licensed under the MIT and GPLv3 licenses.
** https://github.com/okfn/annotator/blob/master/LICENSE
**
** Built at: 2013-06-13 13:48:25Z
*/

(function() {
  var $, Annotator, Delegator, LinkParser, Range, TaskManager, XLogger, fn, functions, g, gettext, util, _Annotator, _CompositeTask, _Task, _TaskGen, _gettext, _i, _j, _len, _len2, _ref, _ref2, _t,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.XLOG_LEVEL = {
    ERROR: 5,
    WARN: 4,
    INFO: 3,
    DEBUG: 2,
    TRACE: 1
  };

  XLogger = (function() {

    function XLogger(name) {
      this.name = name;
      this.setLevel(XLOG_LEVEL.INFO);
    }

    XLogger.prototype.setLevel = function(level) {
      if (level == null) throw new Error("Setting undefined level!");
      return this.level = level;
    };

    XLogger.prototype.currentTimestamp = function() {
      return new Date().getTime();
    };

    XLogger.prototype.elapsedTime = function() {
      if (typeof XLoggerStartTime !== "undefined" && XLoggerStartTime !== null) {
        return this.currentTimestamp() - XLoggerStartTime;
      } else {
        return "???";
      }
    };

    XLogger.prototype.time = function() {
      return "[" + this.elapsedTime() + " ms]";
    };

    XLogger.prototype._log = function(level, objects) {
      var line, lines, obj, result, text, time, _i, _len, _results;
      if (level >= this.level) {
        time = this.time();
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          obj = objects[_i];
          text = (function() {
            if (obj == null) {
              return "null";
            } else if (obj instanceof Error) {
              return obj.stack;
            } else {
              try {
                result = JSON.stringify(obj, null, 2);
              } catch (exception) {
                console.log(obj);
                result = "<SEE ABOVE>";
              }
              return result;
            }
          })();
          lines = text.split("\n");
          _results.push((function() {
            var _j, _len2, _results2;
            _results2 = [];
            for (_j = 0, _len2 = lines.length; _j < _len2; _j++) {
              line = lines[_j];
              _results2.push(console.log(time + " '" + this.name + "': " + line));
            }
            return _results2;
          }).call(this));
        }
        return _results;
      }
    };

    XLogger.prototype.error = function() {
      var objects;
      objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._log(XLOG_LEVEL.ERROR, objects);
    };

    XLogger.prototype.warn = function() {
      var objects;
      objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._log(XLOG_LEVEL.WARN, objects);
    };

    XLogger.prototype.info = function() {
      var objects;
      objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._log(XLOG_LEVEL.INFO, objects);
    };

    XLogger.prototype.debug = function() {
      var objects;
      objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._log(XLOG_LEVEL.DEBUG, objects);
    };

    XLogger.prototype.trace = function() {
      var objects;
      objects = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._log(XLOG_LEVEL.TRACE, objects);
    };

    return XLogger;

  })();

  if (window.XLoggerStartTime == null) {
    window.XLoggerStartTime = new Date().getTime();
  }

  if (window.getXLogger == null) {
    window.getXLogger = function(name) {
      return new XLogger(name);
    };
  }

  window.DomTextMapper = (function() {
    var CONTEXT_LEN, SCAN_JOB_LENGTH_MS, SELECT_CHILDREN_INSTEAD, USE_EMPTY_TEXT_WORKAROUND, USE_TABLE_TEXT_WORKAROUND, WHITESPACE;

    USE_TABLE_TEXT_WORKAROUND = true;

    USE_EMPTY_TEXT_WORKAROUND = true;

    SELECT_CHILDREN_INSTEAD = ["thead", "tbody", "ol", "a", "caption", "p"];

    CONTEXT_LEN = 32;

    SCAN_JOB_LENGTH_MS = 100;

    DomTextMapper.instances = [];

    DomTextMapper.log = getXLogger("DomTextMapper class");

    DomTextMapper.changed = function(node, reason) {
      var dm, instance, _i, _len, _ref;
      if (reason == null) reason = "no reason";
      if (this.instances.length === 0) return;
      dm = this.instances[0];
      this.log.debug("Node @ " + (dm.getPathTo(node)) + " has changed: " + reason);
      _ref = this.instances;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        instance = _ref[_i];
        if (instance.rootNode.contains(node)) {
          instance.performSyncUpdateOnNode(node);
        }
      }
      return null;
    };

    function DomTextMapper(name) {
      this.log = getXLogger(name != null ? name : "dom-text-mapper");
      this.setRealRoot();
      DomTextMapper.instances.push(this);
    }

    DomTextMapper.prototype.setRootNode = function(rootNode) {
      this.rootWin = window;
      return this.pathStartNode = this.rootNode = rootNode;
    };

    DomTextMapper.prototype.setRootId = function(rootId) {
      return this.setRootNode(document.getElementById(rootId));
    };

    DomTextMapper.prototype.setRootIframe = function(iframeId) {
      var iframe;
      iframe = window.document.getElementById(iframeId);
      if (iframe == null) throw new Error("Can't find iframe with specified ID!");
      this.rootWin = iframe.contentWindow;
      if (this.rootWin == null) {
        throw new Error("Can't access contents of the specified iframe!");
      }
      this.rootNode = this.rootWin.document;
      return this.pathStartNode = this.getBody();
    };

    DomTextMapper.prototype.getDefaultPath = function() {
      return this.getPathTo(this.pathStartNode);
    };

    DomTextMapper.prototype.setRealRoot = function() {
      this.rootWin = window;
      this.rootNode = document;
      return this.pathStartNode = this.getBody();
    };

    DomTextMapper.prototype.documentChanged = function() {
      this.lastDOMChange = this.timestamp();
      return this.log.debug("Registered document change.");
    };

    DomTextMapper.prototype.scanSync = function() {
      var node, pathStart, startTime, t1, t2, task;
      if (this.domStableSince(this.lastScanned)) {
        this.log.debug("We have a valid DOM structure cache. Not scanning.");
        return this.path;
      }
      if (!this.pathStartNode.ownerDocument.body.contains(this.pathStartNode)) {
        this.log.debug("We cannot map nodes that are not attached.");
        return this.path;
      }
      this.log.debug("No valid cache, will have to do a scan.");
      this.documentChanged();
      startTime = this.timestamp();
      this.path = {};
      pathStart = this.getDefaultPath();
      task = {
        node: this.pathStartNode,
        path: pathStart
      };
      this.saveSelection();
      this.finishTraverseSync(task);
      this.restoreSelection();
      t1 = this.timestamp();
      this.log.info("Phase I (Path traversal) took " + (t1 - startTime) + " ms.");
      node = this.path[pathStart].node;
      this.collectPositions(node, pathStart, null, 0, 0);
      this.lastScanned = this.timestamp();
      this.corpus = this.path[pathStart].content;
      t2 = this.timestamp();
      this.log.info("Phase II (offset calculation) took " + (t2 - t1) + " ms.");
      this.path;
      return null;
    };

    DomTextMapper.prototype.scanAsync = function(onProgress, onFinished) {
      var pathStart, startTime, task,
        _this = this;
      if (this.domStableSince(this.lastScanned)) {
        this.log.debug("We have a valid DOM structure cache. Not scanning.");
        onFinished(this.path);
      }
      this.log.debug("No valid cache, will have to do a scan.");
      this.documentChanged();
      startTime = this.timestamp();
      this.path = {};
      pathStart = this.getDefaultPath();
      task = {
        node: this.pathStartNode,
        path: pathStart
      };
      this.finishTraverseAsync(task, onProgress, function() {
        var node;
        node = _this.path[pathStart].node;
        _this.collectPositions(node, pathStart, null, 0, 0);
        _this.lastScanned = _this.timestamp();
        _this.corpus = _this.path[pathStart].content;
        return onFinished(_this.path);
      });
      return null;
    };

    DomTextMapper.prototype.selectPath = function(path, scroll) {
      var info, node;
      if (scroll == null) scroll = false;
      info = this.path[path];
      if (info == null) throw new Error("I have no info about a node at " + path);
      node = info != null ? info.node : void 0;
      node || (node = this.lookUpNode(info.path));
      return this.selectNode(node, scroll);
    };

    DomTextMapper.prototype.performSyncUpdateOnNode = function(node, escalating) {
      var data, oldIndex, p, parentNode, parentPath, parentPathInfo, path, pathInfo, pathsToDrop, prefix, prevSiblingPathInfo, startTime, task, _i, _len, _ref;
      if (escalating == null) escalating = false;
      if (node == null) {
        throw new Error("Called performSyncUpdateOnOde with a null node!");
      }
      if (this.path == null) return;
      startTime = this.timestamp();
      if (!escalating) this.saveSelection();
      path = this.getPathTo(node);
      pathInfo = this.path[path];
      if (pathInfo == null) {
        this.performSyncUpdateOnNode(node.parentNode, true);
        if (!escalating) this.restoreSelection();
        return;
      }
      this.log.debug("Performing update on node @ path " + path);
      if (escalating) this.log.debug("(Escalated)");
      this.log.trace("Updating data about " + path + ": ");
      if (pathInfo.node === node && pathInfo.content === this.getNodeContent(node, false)) {
        this.log.trace("Good, the node and the overall content is still the same");
        this.log.trace("Dropping obsolete path info for children...");
        prefix = path + "/";
        pathsToDrop = p;
        pathsToDrop = [];
        _ref = this.path;
        for (p in _ref) {
          data = _ref[p];
          if (this.stringStartsWith(p, prefix)) pathsToDrop.push(p);
        }
        for (_i = 0, _len = pathsToDrop.length; _i < _len; _i++) {
          p = pathsToDrop[_i];
          delete this.path[p];
        }
        task = {
          path: path,
          node: node
        };
        this.finishTraverseSync(task);
        this.log.trace("Done. Collecting new path info...");
        if (pathInfo.node === this.pathStartNode) {
          this.log.debug("Ended up rescanning the whole doc.");
          this.collectPositions(node, path, null, 0, 0);
        } else {
          parentPath = this.parentPath(path);
          parentPathInfo = this.path[parentPath];
          if (parentPathInfo == null) {
            throw new Error("While performing update on node " + path + ", no path info found for parent path: " + parentPath);
          }
          oldIndex = node === node.parentNode.firstChild ? 0 : (prevSiblingPathInfo = this.path[this.getPathTo(node.previousSibling)], prevSiblingPathInfo.end - parentPathInfo.start);
          this.collectPositions(node, path, parentPathInfo.content, parentPathInfo.start, oldIndex);
        }
        this.log.debug("Data update took " + (this.timestamp() - startTime) + " ms.");
      } else {
        this.log.trace("Hm..node has been replaced, or overall content has changed!");
        if (pathInfo.node !== this.pathStartNode) {
          this.log.trace("I guess I must go up one level.");
          parentNode = node.parentNode != null ? (this.log.trace("Node has parent, using that."), node.parentNode) : (parentPath = this.parentPath(path), this.log.trace("Node has no parent, will look up " + parentPath), this.lookUpNode(parentPath));
          this.performSyncUpdateOnNode(parentNode, true);
        } else {
          throw new Error("Can not keep up with the changes, since even the node configured as path start node was replaced.");
        }
      }
      if (!escalating) return this.restoreSelection();
    };

    DomTextMapper.prototype.getInfoForPath = function(path) {
      var result;
      if (this.path == null) {
        throw new Error("Can't get info before running a scan() !");
      }
      result = this.path[path];
      if (result == null) {
        throw new Error("Found no info for path '" + path + "'!");
      }
      return result;
    };

    DomTextMapper.prototype.getInfoForNode = function(node) {
      if (node == null) {
        throw new Error("Called getInfoForNode(node) with null node!");
      }
      return this.getInfoForPath(this.getPathTo(node));
    };

    DomTextMapper.prototype.getMappingsForCharRanges = function(charRanges) {
      var charRange, mapping, _i, _len, _results;
      log.debug("Getting mappings for charRanges:");
      log.debug(charRanges);
      _results = [];
      for (_i = 0, _len = charRanges.length; _i < _len; _i++) {
        charRange = charRanges[_i];
        _results.push(mapping = this.getMappingsForCharRange(charRange.start, charRange.end));
      }
      return _results;
    };

    DomTextMapper.prototype.getContentForPath = function(path) {
      if (path == null) path = null;
      if (this.path == null) {
        throw new Error("Can't get info before running a scan() !");
      }
      if (path == null) path = this.getDefaultPath();
      return this.path[path].content;
    };

    DomTextMapper.prototype.getLengthForPath = function(path) {
      if (path == null) path = null;
      if (path == null) path = this.getDefaultPath();
      return this.path[path].length;
    };

    DomTextMapper.prototype.getDocLength = function() {
      return this.getLengthForPath();
    };

    DomTextMapper.prototype.getContentForCharRange = function(start, end, path) {
      var text;
      if (path == null) path = null;
      text = this.getContentForPath(path).substr(start, end - start);
      return text.trim();
    };

    DomTextMapper.prototype.getContextForCharRange = function(start, end, path) {
      var content, prefix, prefixLen, prefixStart, suffix;
      if (path == null) path = null;
      content = this.getContentForPath(path);
      prefixStart = Math.max(0, start - CONTEXT_LEN);
      prefixLen = start - prefixStart;
      prefix = content.substr(prefixStart, prefixLen);
      suffix = content.substr(end, prefixLen);
      return [prefix.trim(), suffix.trim()];
    };

    DomTextMapper.prototype.getMappingsForCharRange = function(start, end) {
      var endInfo, endMapping, endNode, endOffset, endPath, info, mappings, p, r, result, startInfo, startMapping, startNode, startOffset, startPath, _ref,
        _this = this;
      if (!((start != null) && (end != null))) {
        throw new Error("start and end is required!");
      }
      this.log.trace("Collecting nodes for [" + start + ":" + end + "]");
      if (!this.domStableSince(this.lastScanned)) {
        throw new Error("Can not get mappings, since the dom has changed since last scanned. Call scan first.");
      }
      this.log.trace("Collecting mappings");
      mappings = [];
      _ref = this.path;
      for (p in _ref) {
        info = _ref[p];
        if (info.atomic && this.regions_overlap(info.start, info.end, start, end)) {
          (function(info) {
            var full, mapping;
            _this.log.trace("Checking " + info.path);
            _this.log.trace(info);
            mapping = {
              element: info
            };
            full = start <= info.start && info.end <= end;
            if (full) {
              mapping.full = true;
              mapping.wanted = info.content;
              mapping.yields = info.content;
              mapping.startCorrected = 0;
              mapping.endCorrected = 0;
            } else {
              if (info.node.nodeType === Node.TEXT_NODE) {
                if (start <= info.start) {
                  mapping.end = end - info.start;
                  mapping.wanted = info.content.substr(0, mapping.end);
                } else if (info.end <= end) {
                  mapping.start = start - info.start;
                  mapping.wanted = info.content.substr(mapping.start);
                } else {
                  mapping.start = start - info.start;
                  mapping.end = end - info.start;
                  mapping.wanted = info.content.substr(mapping.start, mapping.end - mapping.start);
                }
                _this.computeSourcePositions(mapping);
                mapping.yields = info.node.data.substr(mapping.startCorrected, mapping.endCorrected - mapping.startCorrected);
              } else if ((info.node.nodeType === Node.ELEMENT_NODE) && (info.node.tagName.toLowerCase() === "img")) {
                _this.log.debug("Can not select a sub-string from the title of an image. Selecting all.");
                mapping.full = true;
                mapping.wanted = info.content;
              } else {
                _this.log.warn("Warning: no idea how to handle partial mappings for node type " + info.node.nodeType);
                if (info.node.tagName != null) {
                  _this.log.warn("Tag: " + info.node.tagName);
                }
                _this.log.warn("Selecting all.");
                mapping.full = true;
                mapping.wanted = info.content;
              }
            }
            mappings.push(mapping);
            return _this.log.trace("Done with " + info.path);
          })(info);
        }
      }
      if (mappings.length === 0) {
        throw new Error("No mappings found for [" + start + ":" + end + "]!");
      }
      mappings = mappings.sort(function(a, b) {
        return a.element.start - b.element.start;
      });
      this.log.trace("Building range...");
      r = this.rootWin.document.createRange();
      startMapping = mappings[0];
      startNode = startMapping.element.node;
      startPath = startMapping.element.path;
      startOffset = startMapping.startCorrected;
      if (startMapping.full) {
        r.setStartBefore(startNode);
        startInfo = startPath;
      } else {
        r.setStart(startNode, startOffset);
        startInfo = startPath + ":" + startOffset;
      }
      endMapping = mappings[mappings.length - 1];
      endNode = endMapping.element.node;
      endPath = endMapping.element.path;
      endOffset = endMapping.endCorrected;
      if (endMapping.full) {
        r.setEndAfter(endNode);
        endInfo = endPath;
      } else {
        r.setEnd(endNode, endOffset);
        endInfo = endPath + ":" + endOffset;
      }
      result = {
        mappings: mappings,
        realRange: r,
        rangeInfo: {
          startPath: startPath,
          startOffset: startOffset,
          startInfo: startInfo,
          endPath: endPath,
          endOffset: endOffset,
          endInfo: endInfo
        },
        safeParent: r.commonAncestorContainer
      };
      this.log.trace("Done collecting");
      return result;
    };

    DomTextMapper.prototype.timestamp = function() {
      return new Date().getTime();
    };

    DomTextMapper.prototype.stringStartsWith = function(string, prefix) {
      return prefix === string.substr(0, prefix.length);
    };

    DomTextMapper.prototype.stringEndsWith = function(string, suffix) {
      return suffix === string.substr(string.length - suffix.length);
    };

    DomTextMapper.prototype.parentPath = function(path) {
      return path.substr(0, path.lastIndexOf("/"));
    };

    DomTextMapper.prototype.domChangedSince = function(timestamp) {
      if ((this.lastDOMChange != null) && (timestamp != null)) {
        return this.lastDOMChange > timestamp;
      } else {
        return true;
      }
    };

    DomTextMapper.prototype.domStableSince = function(timestamp) {
      return !this.domChangedSince(timestamp);
    };

    DomTextMapper.prototype.getProperNodeName = function(node) {
      var nodeName;
      nodeName = node.nodeName;
      switch (nodeName) {
        case "#text":
          return "text()";
        case "#comment":
          return "comment()";
        case "#cdata-section":
          return "cdata-section()";
        default:
          return nodeName;
      }
    };

    DomTextMapper.prototype.getNodePosition = function(node) {
      var pos, tmp;
      pos = 0;
      tmp = node;
      while (tmp) {
        if (tmp.nodeName === node.nodeName) pos++;
        tmp = tmp.previousSibling;
      }
      return pos;
    };

    DomTextMapper.prototype.getPathSegment = function(node) {
      var name, pos;
      name = this.getProperNodeName(node);
      pos = this.getNodePosition(node);
      return name + (pos > 1 ? "[" + pos + "]" : "");
    };

    DomTextMapper.prototype.getPathTo = function(node) {
      var xpath;
      xpath = '';
      while (node !== this.rootNode) {
        if (node == null) {
          throw new Error("Called getPathTo on a node which was not a descendant of @rootNode. " + this.rootNode);
        }
        xpath = (this.getPathSegment(node)) + '/' + xpath;
        node = node.parentNode;
      }
      xpath = (this.rootNode.ownerDocument != null ? './' : '/') + xpath;
      xpath = xpath.replace(/\/$/, '');
      return xpath;
    };

    DomTextMapper.prototype.executeTraverseTask = function(task) {
      var child, cont, invisiable, invisible, node, path, verbose, _i, _len, _ref, _ref2, _ref3;
      node = task.node;
      this.underTraverse = path = task.path;
      invisiable = (_ref = task.invisible) != null ? _ref : false;
      verbose = (_ref2 = task.verbose) != null ? _ref2 : false;
      this.log.trace("Executing traverse task for path " + path);
      cont = this.getNodeContent(node, false);
      this.path[path] = {
        path: path,
        content: cont,
        length: cont.length,
        node: node
      };
      if (cont.length) {
        if (verbose) {
          this.log.info("Collected info about path " + path);
        } else {
          this.log.trace("Collected info about path " + path);
        }
        if (invisible) {
          this.log.warn("Something seems to be wrong. I see visible content @ " + path + ", while some of the ancestor nodes reported empty contents." + " Probably a new selection API bug....");
        }
      } else {
        if (verbose) {
          this.log.info("Found no content at path " + path);
        } else {
          this.log.trace("Found no content at path " + path);
        }
        invisible = true;
      }
      if (node.hasChildNodes()) {
        _ref3 = node.childNodes;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          child = _ref3[_i];
          this.traverseTasks.push({
            node: child,
            path: path + '/' + (this.getPathSegment(child)),
            invisible: invisible,
            verbose: verbose
          });
        }
      }
      return null;
    };

    DomTextMapper.prototype.runTraverseRounds = function() {
      var progress, roundStart, task, tasksDone,
        _this = this;
      try {
        this.saveSelection();
        roundStart = this.timestamp();
        tasksDone = 0;
        while (this.traverseTasks.length && (this.timestamp() - roundStart < SCAN_JOB_LENGTH_MS)) {
          this.log.trace("Queue length is: " + this.traverseTasks.length);
          task = this.traverseTasks.pop();
          this.executeTraverseTask(task);
          tasksDone += 1;
          if (!task.node.hasChildNodes()) {
            this.traverseCoveredChars += this.path[task.path].length;
          }
          this.log.trace("Round covered " + tasksDone + " tasks " + "in " + (this.timestamp() - roundStart) + " ms." + " Covered chars: " + this.traverseCoveredChars);
        }
        this.restoreSelection();
        if (this.traverseOnProgress != null) {
          progress = this.traverseCoveredChars / this.traverseTotalLength;
          this.traverseOnProgress(progress);
        }
        if (this.traverseTasks.length) {
          return window.setTimeout(function() {
            return _this.runTraverseRounds();
          });
        } else {
          return this.traverseOnFinished();
        }
      } catch (exception) {
        return this.log.error("Internal error while traversing", exception);
      }
    };

    DomTextMapper.prototype.finishTraverseSync = function(rootTask) {
      var _results;
      if ((this.traverseTasks != null) && this.traverseTasks.size) {
        throw new Error("A DOM traverse is already in progress!");
      }
      this.traverseTasks = [];
      this.executeTraverseTask(rootTask);
      this.traverseTotalLength = this.path[rootTask.path].length;
      this.traverseCoveredChars = 0;
      _results = [];
      while (this.traverseTasks.length) {
        _results.push(this.executeTraverseTask(this.traverseTasks.pop()));
      }
      return _results;
    };

    DomTextMapper.prototype.finishTraverseAsync = function(rootTask, onProgress, onFinished) {
      var _this = this;
      if ((this.traverseTasks != null) && this.traverseTasks.size) {
        throw new Error("A DOM traverse is already in progress!");
      }
      this.traverseTasks = [];
      this.saveSelection();
      this.executeTraverseTask(rootTask);
      this.restoreSelection();
      this.traverseTotalLength = this.path[rootTask.path].length;
      this.traverseOnProgress = onProgress;
      this.traverseCoveredChars = 0;
      this.traverseOnFinished = onFinished;
      return window.setTimeout(function() {
        return _this.runTraverseRounds();
      });
    };

    DomTextMapper.prototype.getBody = function() {
      return (this.rootWin.document.getElementsByTagName("body"))[0];
    };

    DomTextMapper.prototype.regions_overlap = function(start1, end1, start2, end2) {
      return start1 < end2 && start2 < end1;
    };

    DomTextMapper.prototype.lookUpNode = function(path) {
      var doc, node, results, _ref;
      doc = (_ref = this.rootNode.ownerDocument) != null ? _ref : this.rootNode;
      results = doc.evaluate(path, this.rootNode, null, 0, null);
      return node = results.iterateNext();
    };

    DomTextMapper.prototype.saveSelection = function() {
      var i, sel, _ref;
      if (this.savedSelection != null) {
        throw new Error("Selection already saved! Here:" + this.selectionSaved + "\n\n" + "New attempt to save:");
      }
      sel = this.rootWin.getSelection();
      this.log.debug("Saving selection: " + sel.rangeCount + " ranges.");
      for (i = 0, _ref = sel.rangeCount; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        this.savedSelection = sel.getRangeAt(i);
      }
      switch (sel.rangeCount) {
        case 0:
          if (this.savedSelection == null) this.savedSelection = [];
          break;
        case 1:
          this.savedSelection = [this.savedSelection];
      }
      return this.selectionSaved = (new Error("")).stack;
    };

    DomTextMapper.prototype.restoreSelection = function() {
      var range, sel, _i, _len, _ref;
      this.log.trace("Restoring selection: " + this.savedSelection.length + " ranges.");
      if (this.savedSelection == null) throw new Error("No selection to restore.");
      sel = this.rootWin.getSelection();
      sel.removeAllRanges();
      _ref = this.savedSelection;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        range = _ref[_i];
        sel.addRange(range);
      }
      return delete this.savedSelection;
    };

    DomTextMapper.prototype.selectNode = function(node, scroll) {
      var children, realRange, sel, sn, _ref;
      if (scroll == null) scroll = false;
      if (node == null) throw new Error("Called selectNode with null node!");
      sel = this.rootWin.getSelection();
      sel.removeAllRanges();
      realRange = this.rootWin.document.createRange();
      if (node.nodeType === Node.ELEMENT_NODE && node.hasChildNodes() && (_ref = node.tagName.toLowerCase(), __indexOf.call(SELECT_CHILDREN_INSTEAD, _ref) >= 0)) {
        children = node.childNodes;
        realRange.setStartBefore(children[0]);
        realRange.setEndAfter(children[children.length - 1]);
        sel.addRange(realRange);
      } else {
        if (USE_TABLE_TEXT_WORKAROUND && node.nodeType === Node.TEXT_NODE && node.parentNode.tagName.toLowerCase() === "table") {} else {
          try {
            realRange.setStartBefore(node);
            realRange.setEndAfter(node);
            sel.addRange(realRange);
          } catch (exception) {
            if (!(USE_EMPTY_TEXT_WORKAROUND && this.isWhitespace(node))) {
              this.log.warn("Warning: failed to scan element @ " + this.underTraverse);
              this.log.warn("Content is: " + node.innerHTML);
              this.log.warn("We won't be able to properly anchor to any text inside this element.");
            }
          }
        }
      }
      if (scroll) {
        sn = node;
        while ((sn != null) && !(sn.scrollIntoViewIfNeeded != null)) {
          sn = sn.parentNode;
        }
        if (sn != null) {
          sn.scrollIntoViewIfNeeded();
        } else {
          this.log.warn("Failed to scroll to element. (Browser does not support scrollIntoViewIfNeeded?)");
        }
      }
      return sel;
    };

    DomTextMapper.prototype.readSelectionText = function(sel) {
      sel || (sel = this.rootWin.getSelection());
      return sel.toString().trim().replace(/\n/g, " ").replace(/\s{2,}/g, " ");
    };

    DomTextMapper.prototype.getNodeSelectionText = function(node, shouldRestoreSelection) {
      var sel, text;
      if (shouldRestoreSelection == null) shouldRestoreSelection = true;
      if (shouldRestoreSelection) this.saveSelection();
      sel = this.selectNode(node);
      text = this.readSelectionText(sel);
      if (shouldRestoreSelection) this.restoreSelection();
      return text;
    };

    DomTextMapper.prototype.computeSourcePositions = function(match) {
      var dc, displayEnd, displayIndex, displayStart, displayText, sc, sourceEnd, sourceIndex, sourceStart, sourceText;
      this.log.trace("In computeSourcePosition");
      this.log.trace("Path is '" + match.element.path + "'");
      this.log.trace("Node data is: ", match.element.node.data);
      sourceText = match.element.node.data.replace(/\n/g, " ");
      this.log.trace("sourceText is '" + sourceText + "'");
      displayText = match.element.content;
      this.log.trace("displayText is '" + displayText + "'");
      displayStart = match.start != null ? match.start : 0;
      displayEnd = match.end != null ? match.end : displayText.length;
      this.log.trace("Display charRange is: " + displayStart + "-" + displayEnd);
      if (displayEnd === 0) {
        match.startCorrected = 0;
        match.endCorrected = 0;
        return;
      }
      sourceIndex = 0;
      displayIndex = 0;
      while (!((sourceStart != null) && (sourceEnd != null))) {
        if (sourceIndex === sourceText.length) {
          throw new Error("Error! This node (at '" + match.element.path + "') looks different compared to what I remember! Maybe the document was updated, but d-t-m was not notified?");
        }
        sc = sourceText[sourceIndex];
        dc = displayText[displayIndex];
        if (sc === dc) {
          if (displayIndex === displayStart) sourceStart = sourceIndex;
          displayIndex++;
          if (displayIndex === displayEnd) sourceEnd = sourceIndex + 1;
        }
        sourceIndex++;
      }
      match.startCorrected = sourceStart;
      match.endCorrected = sourceEnd;
      this.log.trace("computeSourcePosition done. Corrected charRange is: " + match.startCorrected + "-" + match.endCorrected);
      return null;
    };

    DomTextMapper.prototype.getNodeContent = function(node, shouldRestoreSelection) {
      if (shouldRestoreSelection == null) shouldRestoreSelection = true;
      return this.getNodeSelectionText(node, shouldRestoreSelection);
    };

    DomTextMapper.prototype.collectPositions = function(node, path, parentContent, parentIndex, index) {
      var atomic, child, childPath, children, content, endIndex, i, newCount, nodeName, oldCount, pathInfo, pos, startIndex, typeCount;
      if (parentContent == null) parentContent = null;
      if (parentIndex == null) parentIndex = 0;
      if (index == null) index = 0;
      this.log.trace("Scanning path " + path);
      pathInfo = this.path[path];
      if (pathInfo == null) {
        this.log.error("I have no info about " + path + ". This should not happen.");
        this.log.error("Node:");
        this.log.error(node);
        this.log.error("This probably was _not_ here last time. Expect problems.");
        return index;
      }
      content = pathInfo != null ? pathInfo.content : void 0;
      if (!(content != null) || content === "") {
        pathInfo.start = parentIndex + index;
        pathInfo.end = parentIndex + index;
        pathInfo.atomic = false;
        return index;
      }
      startIndex = parentContent != null ? parentContent.indexOf(content, index) : index;
      if (startIndex === -1) {
        this.log.trace("Content of this not is not present in content of parent, " + "at path " + path);
        return index;
      }
      endIndex = startIndex + content.length;
      atomic = !node.hasChildNodes();
      pathInfo.start = parentIndex + startIndex;
      pathInfo.end = parentIndex + endIndex;
      pathInfo.atomic = atomic;
      if (!atomic) {
        children = node.childNodes;
        i = 0;
        pos = 0;
        typeCount = Object();
        while (i < children.length) {
          child = children[i];
          nodeName = this.getProperNodeName(child);
          oldCount = typeCount[nodeName];
          newCount = oldCount != null ? oldCount + 1 : 1;
          typeCount[nodeName] = newCount;
          childPath = path + "/" + nodeName + (newCount > 1 ? "[" + newCount + "]" : "");
          pos = this.collectPositions(child, childPath, content, parentIndex + startIndex, pos);
          i++;
        }
      }
      return endIndex;
    };

    WHITESPACE = /^\s*$/;

    DomTextMapper.prototype.isWhitespace = function(node) {
      var child, mightBeEmpty, result;
      result = (function() {
        var _i, _len, _ref;
        switch (node.nodeType) {
          case Node.TEXT_NODE:
            return WHITESPACE.test(node.data);
          case Node.ELEMENT_NODE:
            mightBeEmpty = true;
            _ref = node.childNodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              child = _ref[_i];
              mightBeEmpty = mightBeEmpty && this.isWhitespace(child);
            }
            return mightBeEmpty;
          default:
            return false;
        }
      }).call(this);
      return result;
    };

    return DomTextMapper;

  })();

  window.DTM_ExactMatcher = (function() {

    function DTM_ExactMatcher(log) {
      this.log = log != null ? log : getXLogger("DMP exact matcher");
      this.distinct = true;
      this.caseSensitive = false;
    }

    DTM_ExactMatcher.prototype.setDistinct = function(value) {
      return this.distinct = value;
    };

    DTM_ExactMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_ExactMatcher.prototype.search = function(text, pattern) {
      var i, index, pLen, results,
        _this = this;
      if (text == null) throw new Error("Called search with null text!");
      if (pattern == null) throw new Error("Called search with null pattern!");
      this.log.trace("Searching for '" + pattern + "' in '" + text + "'.");
      pLen = pattern.length;
      results = [];
      index = 0;
      if (!this.caseSensitive) {
        text = text.toLowerCase();
        pattern = pattern.toLowerCase();
      }
      while ((i = text.indexOf(pattern)) > -1) {
        (function() {
          _this.log.trace("Found '" + pattern + "' @ " + i + " (=" + (index + i) + ")");
          results.push({
            start: index + i,
            end: index + i + pLen
          });
          if (_this.distinct) {
            text = text.substr(i + pLen);
            return index += i + pLen;
          } else {
            text = text.substr(i + 1);
            return index += i + 1;
          }
        })();
      }
      return results;
    };

    return DTM_ExactMatcher;

  })();

  window.DTM_RegexMatcher = (function() {

    function DTM_RegexMatcher(log) {
      this.log = log != null ? log : getXLogger("DMP regex matcher");
      this.caseSensitive = false;
    }

    DTM_RegexMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_RegexMatcher.prototype.search = function(text, pattern) {
      var m, re, _results;
      if (text == null) throw new Error("Called search with null text!");
      if (pattern == null) throw new Error("Called search with null pattern!");
      re = new RegExp(pattern, this.caseSensitive ? "g" : "gi");
      _results = [];
      while (m = re.exec(text)) {
        _results.push({
          start: m.index,
          end: m.index + m[0].length
        });
      }
      return _results;
    };

    return DTM_RegexMatcher;

  })();

  window.DTM_DMPMatcher = (function() {

    function DTM_DMPMatcher(log) {
      this.log = log != null ? log : getXLogger("DMP fuzzy matcher");
      this.dmp = new diff_match_patch;
      this.dmp.Diff_Timeout = 0;
      this.caseSensitive = false;
    }

    DTM_DMPMatcher.prototype._reverse = function(text) {
      return text.split("").reverse().join("");
    };

    DTM_DMPMatcher.prototype.getMaxPatternLength = function() {
      return this.dmp.Match_MaxBits;
    };

    DTM_DMPMatcher.prototype.setMatchDistance = function(distance) {
      return this.dmp.Match_Distance = distance;
    };

    DTM_DMPMatcher.prototype.getMatchDistance = function() {
      return this.dmp.Match_Distance;
    };

    DTM_DMPMatcher.prototype.setMatchThreshold = function(threshold) {
      return this.dmp.Match_Threshold = threshold;
    };

    DTM_DMPMatcher.prototype.getMatchThreshold = function() {
      return this.dmp.Match_Threshold;
    };

    DTM_DMPMatcher.prototype.getCaseSensitive = function() {
      return caseSensitive;
    };

    DTM_DMPMatcher.prototype.setCaseSensitive = function(value) {
      return this.caseSensitive = value;
    };

    DTM_DMPMatcher.prototype.search = function(text, pattern, expectedStartLoc, options) {
      var endIndex, endLen, endLoc, endPos, endSlice, found, matchLen, maxLen, pLen, result, startIndex, startLen, startPos, startSlice;
      if (expectedStartLoc == null) expectedStartLoc = 0;
      if (options == null) options = {};
      if (text == null) throw new Error("Called search with null text!");
      if (pattern == null) throw new Error("Called search with null pattern!");
      this.log.trace("In dtm search. text: '" + text + "', pattern: '" + pattern + "', expectedStartLoc: " + expectedStartLoc + ", options:", options);
      if (expectedStartLoc < 0) {
        throw new Error("Can't search at negative indices!");
      }
      if (!this.caseSensitive) {
        text = text.toLowerCase();
        pattern = pattern.toLowerCase();
      }
      pLen = pattern.length;
      maxLen = this.getMaxPatternLength();
      if (pLen <= maxLen) {
        result = this.searchForSlice(text, pattern, expectedStartLoc);
      } else {
        startSlice = pattern.substr(0, maxLen);
        startPos = this.searchForSlice(text, startSlice, expectedStartLoc);
        if (startPos != null) {
          startLen = startPos.end - startPos.start;
          endSlice = pattern.substr(pLen - maxLen, maxLen);
          endLoc = startPos.start + pLen - maxLen;
          endPos = this.searchForSlice(text, endSlice, endLoc);
          if (endPos != null) {
            endLen = endPos.end - endPos.start;
            matchLen = endPos.end - startPos.start;
            startIndex = startPos.start;
            endIndex = endPos.end;
            if ((pLen * 0.5 <= matchLen && matchLen <= pLen * 1.5)) {
              result = {
                start: startIndex,
                end: endPos.end
              };
            } else {
              this.log.trace("Sorry, matchLen (" + matchLen + ") is not between " + 0.5 * pLen + " and " + 1.5 * pLen);
            }
          } else {
            this.log.trace("endSlice ('" + endSlice + "') not found");
          }
        } else {
          this.log.trace("startSlice ('" + startSlice + "') not found");
        }
      }
      if (result == null) return [];
      if (options.withLevenhstein || options.withDiff) {
        found = text.substr(result.start, result.end - result.start);
        result.diff = this.dmp.diff_main(pattern, found);
        if (options.withLevenshstein) {
          result.lev = this.dmp.diff_levenshtein(result.diff);
        }
        if (options.withDiff) {
          this.dmp.diff_cleanupSemantic(result.diff);
          result.diffHTML = this.dmp.diff_prettyHtml(result.diff);
        }
      }
      return [result];
    };

    DTM_DMPMatcher.prototype.compare = function(text1, text2) {
      var result;
      if (!((text1 != null) && (text2 != null))) {
        throw new Error("Can not compare non-existing strings!");
      }
      result = {};
      result.diff = this.dmp.diff_main(text1, text2);
      result.lev = this.dmp.diff_levenshtein(result.diff);
      result.errorLevel = result.lev / text1.length;
      this.dmp.diff_cleanupSemantic(result.diff);
      result.diffHTML = this.dmp.diff_prettyHtml(result.diff);
      return result;
    };

    DTM_DMPMatcher.prototype.searchForSlice = function(text, slice, expectedStartLoc) {
      var dneIndex, endIndex, expectedDneLoc, expectedEndLoc, nrettap, r1, r2, result, startIndex, txet;
      this.log.trace("searchForSlice: '" + text + "', '" + slice + "', " + expectedStartLoc);
      r1 = this.dmp.match_main(text, slice, expectedStartLoc);
      startIndex = r1.index;
      if (startIndex === -1) return null;
      txet = this._reverse(text);
      nrettap = this._reverse(slice);
      expectedEndLoc = startIndex + slice.length;
      expectedDneLoc = text.length - expectedEndLoc;
      r2 = this.dmp.match_main(txet, nrettap, expectedDneLoc);
      dneIndex = r2.index;
      endIndex = text.length - dneIndex;
      return result = {
        start: startIndex,
        end: endIndex
      };
    };

    return DTM_DMPMatcher;

  })();

  window.DomTextMatcher = (function() {

    DomTextMatcher.prototype.setRootNode = function(rootNode) {
      return this.mapper.setRootNode(rootNode);
    };

    DomTextMatcher.prototype.setRootId = function(rootId) {
      return this.mapper.setRootId(rootId);
    };

    DomTextMatcher.prototype.setRootIframe = function(iframeId) {
      return this.mapper.setRootIframe(iframeId);
    };

    DomTextMatcher.prototype.setRealRoot = function() {
      return this.mapper.setRealRoot();
    };

    DomTextMatcher.prototype.documentChanged = function() {
      return this.mapper.documentChanged();
    };

    DomTextMatcher.prototype.scanAsync = function(onProgress, onFinished) {
      var t0,
        _this = this;
      if (onFinished == null) {
        throw new Error("Called scan() with no onFinished argument!");
      }
      t0 = this.timestamp();
      this.mapper.scanAsync(onProgress, function(data) {
        var t1;
        t1 = _this.timestamp();
        return onFinished({
          time: t1 - t0,
          data: data
        });
      });
      return null;
    };

    DomTextMatcher.prototype.scanPromise = function() {
      var dfd, onFinished, onProgress,
        _this = this;
      dfd = new jQuery.Deferred();
      onProgress = function(data) {
        return dfd.notify({
          text: "scanning...",
          progress: data
        });
      };
      onFinished = function(data) {
        return dfd.resolve(data);
      };
      this.scanAsync(onProgress, onFinished);
      return dfd.promise();
    };

    DomTextMatcher.prototype.scanSync = function() {
      var data, t0, t1;
      t0 = this.timestamp();
      data = this.mapper.scanSync();
      t1 = this.timestamp();
      return {
        time: t1 - t0,
        data: data
      };
    };

    DomTextMatcher.prototype.getDefaultPath = function() {
      return this.mapper.getDefaultPath();
    };

    DomTextMatcher.prototype.searchExact = function(pattern, distinct, caseSensitive, path) {
      if (distinct == null) distinct = true;
      if (caseSensitive == null) caseSensitive = false;
      if (path == null) path = null;
      if (!this.pm) this.pm = new window.DTM_ExactMatcher;
      this.pm.setDistinct(distinct);
      this.pm.setCaseSensitive(caseSensitive);
      return this.search(this.pm, pattern, null, path);
    };

    DomTextMatcher.prototype.searchRegex = function(pattern, caseSensitive, path) {
      if (caseSensitive == null) caseSensitive = false;
      if (path == null) path = null;
      if (!this.rm) this.rm = new window.DTM_RegexMatcher;
      this.rm.setCaseSensitive(caseSensitive);
      return this.search(this.rm, pattern, null, path);
    };

    DomTextMatcher.prototype.searchFuzzy = function(pattern, pos, caseSensitive, path, options) {
      var _ref, _ref2;
      if (caseSensitive == null) caseSensitive = false;
      if (path == null) path = null;
      if (options == null) options = {};
      this.ensureDMP();
      this.dmp.setMatchDistance((_ref = options.matchDistance) != null ? _ref : 1000);
      this.dmp.setMatchThreshold((_ref2 = options.matchThreshold) != null ? _ref2 : 0.5);
      this.dmp.setCaseSensitive(caseSensitive);
      return this.search(this.dmp, pattern, pos, path, options);
    };

    DomTextMatcher.prototype.normalizeString = function(string) {
      return string.replace(/\s{2,}/g, " ");
    };

    DomTextMatcher.prototype.searchFuzzyWithContext = function(prefix, suffix, pattern, expectedStart, expectedEnd, caseSensitive, path, options) {
      var analysis, charRange, expectedPrefixStart, expectedSuffixStart, k, len, mappings, match, matchThreshold, obj, patternLength, prefixEnd, prefixResult, remainingText, suffixResult, suffixStart, v, _i, _len, _ref, _ref2, _ref3, _ref4;
      if (expectedStart == null) expectedStart = null;
      if (expectedEnd == null) expectedEnd = null;
      if (caseSensitive == null) caseSensitive = false;
      if (path == null) path = null;
      if (options == null) options = {};
      this.ensureDMP();
      if (!((prefix != null) && (suffix != null))) {
        throw new Error("Can not do a context-based fuzzy search with missing context!");
      }
      len = this.mapper.getDocLength();
      expectedPrefixStart = expectedStart != null ? expectedStart - prefix.length : len / 2;
      this.dmp.setMatchDistance((_ref = options.contextMatchDistance) != null ? _ref : len * 2);
      this.dmp.setMatchThreshold((_ref2 = options.contextMatchThreshold) != null ? _ref2 : 0.5);
      prefixResult = this.dmp.search(this.mapper.corpus, prefix, expectedPrefixStart);
      if (!prefixResult.length) {
        return {
          matches: []
        };
      }
      prefixEnd = prefixResult[0].end;
      patternLength = pattern != null ? pattern.length : (expectedStart != null) && (expectedEnd != null) ? expectedEnd - expectedStart : 64;
      remainingText = this.mapper.corpus.substr(prefixEnd);
      expectedSuffixStart = patternLength;
      suffixResult = this.dmp.search(remainingText, suffix, expectedSuffixStart);
      if (!suffixResult.length) {
        return {
          matches: []
        };
      }
      suffixStart = prefixEnd + suffixResult[0].start;
      charRange = {
        start: prefixEnd,
        end: suffixStart
      };
      matchThreshold = (_ref3 = options.patternMatchThreshold) != null ? _ref3 : 0.5;
      analysis = this.analyzeMatch(pattern, charRange, true);
      if ((!(pattern != null)) || analysis.exact || (analysis.comparison.errorLevel <= matchThreshold)) {
        mappings = this.mapper.getMappingsForCharRange(prefixEnd, suffixStart);
        match = {};
        _ref4 = [charRange, analysis, mappings];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          obj = _ref4[_i];
          for (k in obj) {
            v = obj[k];
            match[k] = v;
          }
        }
        return {
          matches: [match]
        };
      }
      this.log.debug("Rejecting the match, because error level is too high. (" + errorLevel + ")");
      return {
        matches: []
      };
    };

    function DomTextMatcher(domTextMapper, name) {
      if (name == null) name = "matcher";
      this.log = getXLogger(name);
      this.mapper = domTextMapper;
    }

    DomTextMatcher.prototype.search = function(matcher, pattern, pos, path, options) {
      var fuzzyComparison, matches, result, t0, t1, t2, t3, textMatch, textMatches, _fn, _i, _len, _ref,
        _this = this;
      if (path == null) path = null;
      if (options == null) options = {};
      if (pattern == null) throw new Error("Can't search for null pattern!");
      pattern = pattern.trim();
      if (pattern == null) throw new Error("Can't search an for empty pattern!");
      fuzzyComparison = (_ref = options.withFuzzyComparison) != null ? _ref : false;
      t0 = this.timestamp();
      if (path != null) this.scan();
      t1 = this.timestamp();
      textMatches = matcher.search(this.mapper.corpus, pattern, pos, options);
      t2 = this.timestamp();
      matches = [];
      _fn = function(textMatch) {
        var analysis, k, mappings, match, obj, v, _j, _len2, _ref2;
        analysis = _this.analyzeMatch(pattern, textMatch, fuzzyComparison);
        mappings = _this.mapper.getMappingsForCharRange(textMatch.start, textMatch.end);
        match = {};
        _ref2 = [textMatch, analysis, mappings];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          obj = _ref2[_j];
          for (k in obj) {
            v = obj[k];
            match[k] = v;
          }
        }
        matches.push(match);
        return null;
      };
      for (_i = 0, _len = textMatches.length; _i < _len; _i++) {
        textMatch = textMatches[_i];
        _fn(textMatch);
      }
      t3 = this.timestamp();
      result = {
        matches: matches,
        time: {
          phase0_domMapping: t1 - t0,
          phase1_textMatching: t2 - t1,
          phase2_matchMapping: t3 - t2,
          total: t3 - t0
        }
      };
      return result;
    };

    DomTextMatcher.prototype.timestamp = function() {
      return new Date().getTime();
    };

    DomTextMatcher.prototype.analyzeMatch = function(pattern, charRange, useFuzzy) {
      var expected, found, result;
      if (useFuzzy == null) useFuzzy = false;
      expected = this.normalizeString(pattern);
      found = this.normalizeString(this.mapper.getContentForCharRange(charRange.start, charRange.end));
      result = {
        found: found,
        exact: found === expected
      };
      if (!result.exact && useFuzzy) {
        this.ensureDMP();
        result.comparison = this.dmp.compare(expected, found);
      }
      return result;
    };

    DomTextMatcher.prototype.ensureDMP = function() {
      if (this.dmp == null) {
        if (window.DTM_DMPMatcher == null) {
          throw new Error("DTM_DMPMatcher is not available. Have you loaded the text match engines?");
        }
        return this.dmp = new window.DTM_DMPMatcher;
      }
    };

    return DomTextMatcher;

  })();

  gettext = null;

  if (typeof Gettext !== "undefined" && Gettext !== null) {
    _gettext = new Gettext({
      domain: "annotator"
    });
    gettext = function(msgid) {
      return _gettext.gettext(msgid);
    };
  } else {
    gettext = function(msgid) {
      return msgid;
    };
  }

  _t = function(msgid) {
    return gettext(msgid);
  };

  if (!(typeof jQuery !== "undefined" && jQuery !== null ? (_ref = jQuery.fn) != null ? _ref.jquery : void 0 : void 0)) {
    console.error(_t("Annotator requires jQuery: have you included lib/vendor/jquery.js?"));
  }

  if (!(JSON && JSON.parse && JSON.stringify)) {
    console.error(_t("Annotator requires a JSON implementation: have you included lib/vendor/json2.js?"));
  }

  $ = jQuery.sub();

  $.flatten = function(array) {
    var flatten;
    flatten = function(ary) {
      var el, flat, _i, _len;
      flat = [];
      for (_i = 0, _len = ary.length; _i < _len; _i++) {
        el = ary[_i];
        flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
      }
      return flat;
    };
    return flatten(array);
  };

  $.plugin = function(name, object) {
    return jQuery.fn[name] = function(options) {
      var args;
      args = Array.prototype.slice.call(arguments, 1);
      return this.each(function() {
        var instance;
        instance = $.data(this, name);
        if (instance) {
          return options && instance[options].apply(instance, args);
        } else {
          instance = new object(this, options);
          return $.data(this, name, instance);
        }
      });
    };
  };

  $.fn.textNodes = function() {
    var getTextNodes;
    getTextNodes = function(node) {
      var nodes;
      if (node && node.nodeType !== 3) {
        nodes = [];
        if (node.nodeType !== 8) {
          node = node.lastChild;
          while (node) {
            nodes.push(getTextNodes(node));
            node = node.previousSibling;
          }
        }
        return nodes.reverse();
      } else {
        return node;
      }
    };
    return this.map(function() {
      return $.flatten(getTextNodes(this));
    });
  };

  $.fn.xpath = function(relativeRoot) {
    var jq;
    jq = this.map(function() {
      var elem, idx, path, tagName;
      path = '';
      elem = this;
      while (elem && elem.nodeType === 1 && elem !== relativeRoot) {
        tagName = elem.tagName.replace(":", "\\:");
        idx = $(elem.parentNode).children(tagName).index(elem) + 1;
        idx = "[" + idx + "]";
        path = "/" + elem.tagName.toLowerCase() + idx + path;
        elem = elem.parentNode;
      }
      return path;
    });
    return jq.get();
  };

  $.escape = function(html) {
    return html.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  $.fn.escape = function(html) {
    if (arguments.length) return this.html($.escape(html));
    return this.html();
  };

  $.fn.reverse = []._reverse || [].reverse;

  functions = ["log", "debug", "info", "warn", "exception", "assert", "dir", "dirxml", "trace", "group", "groupEnd", "groupCollapsed", "time", "timeEnd", "profile", "profileEnd", "count", "clear", "table", "error", "notifyFirebug", "firebug", "userObjects"];

  if (typeof console !== "undefined" && console !== null) {
    if (!(console.group != null)) {
      console.group = function(name) {
        return console.log("GROUP: ", name);
      };
    }
    if (!(console.groupCollapsed != null)) console.groupCollapsed = console.group;
    for (_i = 0, _len = functions.length; _i < _len; _i++) {
      fn = functions[_i];
      if (!(console[fn] != null)) {
        console[fn] = function() {
          return console.log(_t("Not implemented:") + (" console." + name));
        };
      }
    }
  } else {
    this.console = {};
    for (_j = 0, _len2 = functions.length; _j < _len2; _j++) {
      fn = functions[_j];
      this.console[fn] = function() {};
    }
    this.console['error'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return alert("ERROR: " + (args.join(', ')));
    };
    this.console['warn'] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return alert("WARNING: " + (args.join(', ')));
    };
  }

  Delegator = (function() {

    Delegator.prototype.events = {};

    Delegator.prototype.options = {};

    Delegator.prototype.element = null;

    function Delegator(element, options) {
      this.options = $.extend(true, {}, this.options, options);
      this.element = $(element);
      this.on = this.subscribe;
      this.addEvents();
    }

    Delegator.prototype.addEvents = function() {
      var event, functionName, sel, selector, _k, _ref2, _ref3, _results;
      _ref2 = this.events;
      _results = [];
      for (sel in _ref2) {
        functionName = _ref2[sel];
        _ref3 = sel.split(' '), selector = 2 <= _ref3.length ? __slice.call(_ref3, 0, _k = _ref3.length - 1) : (_k = 0, []), event = _ref3[_k++];
        _results.push(this.addEvent(selector.join(' '), event, functionName));
      }
      return _results;
    };

    Delegator.prototype.addEvent = function(bindTo, event, functionName) {
      var closure, isBlankSelector,
        _this = this;
      closure = function() {
        return _this[functionName].apply(_this, arguments);
      };
      isBlankSelector = typeof bindTo === 'string' && bindTo.replace(/\s+/g, '') === '';
      if (isBlankSelector) bindTo = this.element;
      if (typeof bindTo === 'string') {
        this.element.delegate(bindTo, event, closure);
      } else {
        if (this.isCustomEvent(event)) {
          this.subscribe(event, closure);
        } else {
          $(bindTo).bind(event, closure);
        }
      }
      return this;
    };

    Delegator.prototype.isCustomEvent = function(event) {
      event = event.split('.')[0];
      return $.inArray(event, Delegator.natives) === -1;
    };

    Delegator.prototype.publish = function() {
      this.element.triggerHandler.apply(this.element, arguments);
      return this;
    };

    Delegator.prototype.subscribe = function(event, callback) {
      var closure;
      closure = function() {
        return callback.apply(this, [].slice.call(arguments, 1));
      };
      closure.guid = callback.guid = ($.guid += 1);
      this.element.bind(event, closure);
      return this;
    };

    Delegator.prototype.unsubscribe = function() {
      this.element.unbind.apply(this.element, arguments);
      return this;
    };

    return Delegator;

  })();

  Delegator.natives = (function() {
    var key, specials, val;
    specials = (function() {
      var _ref2, _results;
      _ref2 = jQuery.event.special;
      _results = [];
      for (key in _ref2) {
        if (!__hasProp.call(_ref2, key)) continue;
        val = _ref2[key];
        _results.push(key);
      }
      return _results;
    })();
    return "blur focus focusin focusout load resize scroll unload click dblclick\nmousedown mouseup mousemove mouseover mouseout mouseenter mouseleave\nchange select submit keydown keypress keyup error".split(/[^a-z]+/).concat(specials);
  })();

  Range = {};

  Range.sniff = function(r) {
    if (r.commonAncestorContainer != null) {
      return new Range.BrowserRange(r);
    } else if (typeof r.start === "string") {
      return new Range.SerializedRange({
        startContainer: r.start,
        startOffset: r.startOffset,
        endContainer: r.end,
        endOffset: r.endOffset
      });
    } else if (typeof r.startContainer === "string") {
      return new Range.SerializedRange(r);
    } else if (r.start && typeof r.start === "object") {
      return new Range.NormalizedRange(r);
    } else {
      console.error(_t("Could not sniff range type"));
      return false;
    }
  };

  Range.nodeFromXPath = function(xpath, root) {
    var customResolver, evaluateXPath, namespace, node, segment;
    if (root == null) root = document;
    evaluateXPath = function(xp, nsResolver) {
      if (nsResolver == null) nsResolver = null;
      return document.evaluate('.' + xp, root, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    if (!$.isXMLDoc(document.documentElement)) {
      return evaluateXPath(xpath);
    } else {
      customResolver = document.createNSResolver(document.ownerDocument === null ? document.documentElement : document.ownerDocument.documentElement);
      node = evaluateXPath(xpath, customResolver);
      if (!node) {
        xpath = ((function() {
          var _k, _len3, _ref2, _results;
          _ref2 = xpath.split('/');
          _results = [];
          for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
            segment = _ref2[_k];
            if (segment && segment.indexOf(':') === -1) {
              _results.push(segment.replace(/^([a-z]+)/, 'xhtml:$1'));
            } else {
              _results.push(segment);
            }
          }
          return _results;
        })()).join('/');
        namespace = document.lookupNamespaceURI(null);
        customResolver = function(ns) {
          if (ns === 'xhtml') {
            return namespace;
          } else {
            return document.documentElement.getAttribute('xmlns:' + ns);
          }
        };
        node = evaluateXPath(xpath, customResolver);
      }
      return node;
    }
  };

  Range.RangeError = (function(_super) {

    __extends(RangeError, _super);

    function RangeError(type, message, parent) {
      this.type = type;
      this.message = message;
      this.parent = parent != null ? parent : null;
      RangeError.__super__.constructor.call(this, this.message);
    }

    return RangeError;

  })(Error);

  Range.BrowserRange = (function() {

    function BrowserRange(obj) {
      this.commonAncestorContainer = obj.commonAncestorContainer;
      this.startContainer = obj.startContainer;
      this.startOffset = obj.startOffset;
      this.endContainer = obj.endContainer;
      this.endOffset = obj.endOffset;
    }

    BrowserRange.prototype.normalize = function(root) {
      var changed, isImg, it, next, node, nr, offset, p, r, _k, _len3, _ref2;
      if (this.tainted) {
        console.error(_t("You may only call normalize() once on a BrowserRange!"));
        return false;
      } else {
        this.tainted = true;
      }
      r = {};
      nr = {};
      _ref2 = ['start', 'end'];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        p = _ref2[_k];
        node = this[p + 'Container'];
        offset = this[p + 'Offset'];
        if (node.nodeType === Node.ELEMENT_NODE) {
          it = node.childNodes[offset];
          node = it || node.childNodes[offset - 1];
          isImg = node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "img";
          if (isImg) {
            offset = 0;
          } else {
            while (node.nodeType === Node.ELEMENT_NODE && !node.firstChild && !isImg) {
              it = null;
              node = node.previousSibling;
            }
            while (node.nodeType !== Node.TEXT_NODE) {
              node = node.firstChild;
            }
            offset = it ? 0 : node.nodeValue.length;
          }
        }
        r[p] = node;
        r[p + 'Offset'] = offset;
        r[p + 'Img'] = isImg;
      }
      if (r.start === r.end && r.startOffset === r.endOffset) {
        throw new Error("Trying to normalize invalid brower range, where startOffset == endOffset = " + r.startOffset + "!");
      }
      changed = false;
      if (r.startOffset > 0) {
        if (r.start.data.length < r.startOffset) {
          throw new Error("Normalizing invalid browser range: data length is " + r.start.data.length + ", but wanted start offset is " + r.startOffset);
        } else if (r.start.data.length > r.startOffset) {
          nr.start = r.start.splitText(r.startOffset);
          changed = true;
        } else {
          nr.start = r.start.nextSibling;
        }
      } else {
        nr.start = r.start;
      }
      if (r.start === r.end && !r.startImg) {
        if ((r.endOffset - r.startOffset) < nr.start.nodeValue.length) {
          next = nr.start.splitText(r.endOffset - r.startOffset);
          changed = true;
        } else {

        }
        nr.end = nr.start;
      } else {
        if (r.endOffset < r.end.nodeValue.length && !r.endImg) {
          r.end.splitText(r.endOffset);
          changed = true;
        } else {

        }
        nr.end = r.end;
      }
      nr.commonAncestor = this.commonAncestorContainer;
      while (nr.commonAncestor.nodeType !== Node.ELEMENT_NODE) {
        nr.commonAncestor = nr.commonAncestor.parentNode;
      }
      if ((window.DomTextMapper != null) && changed) {
        window.DomTextMapper.changed(nr.commonAncestor, "range normalization");
      }
      return new Range.NormalizedRange(nr);
    };

    BrowserRange.prototype.serialize = function(root, ignoreSelector) {
      return this.normalize(root).serialize(root, ignoreSelector);
    };

    return BrowserRange;

  })();

  Range.NormalizedRange = (function() {

    function NormalizedRange(obj) {
      this.commonAncestor = obj.commonAncestor;
      this.start = obj.start;
      this.end = obj.end;
    }

    NormalizedRange.prototype.normalize = function(root) {
      return this;
    };

    NormalizedRange.prototype.limit = function(bounds) {
      var nodes, parent, startParents, _k, _len3, _ref2;
      nodes = $.grep(this.textNodes(), function(node) {
        return node.parentNode === bounds || $.contains(bounds, node.parentNode);
      });
      if (!nodes.length) return null;
      this.start = nodes[0];
      this.end = nodes[nodes.length - 1];
      startParents = $(this.start).parents();
      _ref2 = $(this.end).parents();
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        parent = _ref2[_k];
        if (startParents.index(parent) !== -1) {
          this.commonAncestor = parent;
          break;
        }
      }
      return this;
    };

    NormalizedRange.prototype.serialize = function(root, ignoreSelector) {
      var end, serialization, start;
      serialization = function(node, isEnd) {
        var isImg, n, nodes, offset, origParent, textNodes, xpath, _k, _len3;
        if (ignoreSelector) {
          origParent = $(node).parents(":not(" + ignoreSelector + ")").eq(0);
        } else {
          origParent = $(node).parent();
        }
        xpath = origParent.xpath(root)[0];
        textNodes = origParent.textNodes();
        nodes = textNodes.slice(0, textNodes.index(node));
        offset = 0;
        for (_k = 0, _len3 = nodes.length; _k < _len3; _k++) {
          n = nodes[_k];
          offset += n.nodeValue.length;
        }
        isImg = node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "img";
        if (isEnd && !isImg) {
          return [xpath, offset + node.nodeValue.length];
        } else {
          return [xpath, offset];
        }
      };
      start = serialization(this.start);
      end = serialization(this.end, true);
      return new Range.SerializedRange({
        startContainer: start[0],
        endContainer: end[0],
        startOffset: start[1],
        endOffset: end[1]
      });
    };

    NormalizedRange.prototype.text = function() {
      var node;
      return ((function() {
        var _k, _len3, _ref2, _results;
        _ref2 = this.textNodes();
        _results = [];
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          node = _ref2[_k];
          _results.push(node.nodeValue);
        }
        return _results;
      }).call(this)).join('');
    };

    NormalizedRange.prototype.textNodes = function() {
      var end, start, textNodes, _ref2;
      textNodes = $(this.commonAncestor).textNodes();
      _ref2 = [textNodes.index(this.start), textNodes.index(this.end)], start = _ref2[0], end = _ref2[1];
      return $.makeArray(textNodes.slice(start, end + 1 || 9e9));
    };

    NormalizedRange.prototype.toRange = function() {
      var range;
      range = document.createRange();
      range.setStartBefore(this.start);
      range.setEndAfter(this.end);
      return range;
    };

    return NormalizedRange;

  })();

  Range.SerializedRange = (function() {

    function SerializedRange(obj) {
      this.startContainer = obj.startContainer;
      this.startOffset = obj.startOffset;
      this.endContainer = obj.endContainer;
      this.endOffset = obj.endOffset;
    }

    SerializedRange.prototype.normalize = function(root) {
      var contains, length, node, p, range, targetOffset, tn, xpath, _k, _l, _len3, _len4, _ref2, _ref3;
      range = {};
      _ref2 = ['start', 'end'];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        p = _ref2[_k];
        xpath = this[p + 'Container'];
        try {
          node = Range.nodeFromXPath(xpath, root);
        } catch (e) {
          throw new Range.RangeError(p, ("Error while finding " + p + " node: " + xpath + ": ") + e, e);
        }
        if (!node) {
          throw new Range.RangeError(p, "Couldn't find " + p + " node: " + xpath);
        }
        length = 0;
        targetOffset = this[p + 'Offset'] + (p === "start" ? 1 : 0);
        _ref3 = $(node).textNodes();
        for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
          tn = _ref3[_l];
          if (length + tn.nodeValue.length >= targetOffset) {
            range[p + 'Container'] = tn;
            range[p + 'Offset'] = this[p + 'Offset'] - length;
            break;
          } else {
            length += tn.nodeValue.length;
          }
        }
        if (!(range[p + 'Offset'] != null)) {
          throw new Range.RangeError("" + p + "offset", "Couldn't find offset " + this[p + 'Offset'] + " in element " + this[p]);
        }
      }
      contains = !(document.compareDocumentPosition != null) ? function(a, b) {
        return a.contains(b);
      } : function(a, b) {
        return a.compareDocumentPosition(b) & 16;
      };
      $(range.startContainer).parents().each(function() {
        if (contains(this, range.endContainer)) {
          range.commonAncestorContainer = this;
          return false;
        }
      });
      return new Range.BrowserRange(range).normalize(root);
    };

    SerializedRange.prototype.serialize = function(root, ignoreSelector) {
      return this.normalize(root).serialize(root, ignoreSelector);
    };

    SerializedRange.prototype.toObject = function() {
      return {
        startContainer: this.startContainer,
        startOffset: this.startOffset,
        endContainer: this.endContainer,
        endOffset: this.endOffset
      };
    };

    return SerializedRange;

  })();

  _Task = (function() {

    _Task.prototype.uniqueId = function(length) {
      var id;
      if (length == null) length = 8;
      id = "";
      while (id.length < length) {
        id += Math.random().toString(36).substr(2);
      }
      return id.substr(0, length);
    };

    function _Task(info) {
      this._skip = __bind(this._skip, this);
      this._start = __bind(this._start, this);
      var _this = this;
      if (info.manager == null) {
        throw new Error("Trying to create task with no manager!");
      }
      if (info.name == null) {
        throw new Error("Trying to create task with no name!");
      }
      if (info.code == null) {
        throw new Error("Trying to define task with no code!");
      }
      this.manager = info.manager;
      this.log = this.manager.log;
      this.taskID = this.uniqueId();
      this._name = info.name;
      this._todo = info.code;
      this._data = info.data;
      if (info.deps == null) info.deps = [];
      this.setDeps(info.deps);
      this.started = false;
      this.dfd = new jQuery.Deferred();
      this.dfd._notify = this.dfd.notify;
      this.dfd.notify = function(data) {
        return _this.dfd._notify($.extend(data, {
          task: _this
        }));
      };
      this.dfd._resolve = this.dfd.resolve;
      this.dfd.resolve = function() {
        throw new Error("Use ready() instead of resolve()!");
      };
      this.dfd._reject = this.dfd.reject;
      this.dfd.reject = function() {
        throw new Error("Use failed() instead of reject()!");
      };
      this.dfd.ready = function(data) {
        var elapsedTime, endTime;
        if (_this.dfd.state() !== "pending") {
          throw new Error("Called ready() on a task in state '" + _this.dfd.state() + "'!");
        }
        endTime = new Date().getTime();
        elapsedTime = endTime - _this.dfd.startTime;
        _this.dfd.notify({
          progress: 1,
          text: "Finished in " + elapsedTime + "ms."
        });
        return _this.dfd._resolve(data);
      };
      this.dfd.failed = function(data) {
        var elapsedTime, endTime;
        if (_this.dfd.state() !== "pending") {
          throw new Error("Called failed() on a task in state '" + _this.dfd.state() + "'!");
        }
        endTime = new Date().getTime();
        elapsedTime = endTime - _this.dfd.startTime;
        _this.dfd.notify({
          progress: 1,
          text: "Failed in " + elapsedTime + "ms."
        });
        return _this.dfd._reject(data);
      };
      this.dfd.promise(this);
    }

    _Task.prototype.setDeps = function(deps) {
      this._deps = [];
      return this.addDeps(deps);
    };

    _Task.prototype.addDeps = function(toAdd) {
      var dep, _k, _len3, _results;
      if (!Array.isArray(toAdd)) toAdd = [toAdd];
      _results = [];
      for (_k = 0, _len3 = toAdd.length; _k < _len3; _k++) {
        dep = toAdd[_k];
        _results.push(this._deps.push(dep));
      }
      return _results;
    };

    _Task.prototype.removeDeps = function(toRemove) {
      this.log.debug("Should remove:", toRemove);
      if (!Array.isArray(toRemove)) toRemove = [toRemove];
      this._deps = this._deps.filter(function(dep) {
        return __indexOf.call(toRemove, dep) < 0;
      });
      return this.log.debug("Deps now:", this._deps);
    };

    _Task.prototype.resolveDeps = function() {
      var dep;
      return this._depsResolved = (function() {
        var _k, _len3, _ref2, _results;
        _ref2 = this._deps;
        _results = [];
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          dep = _ref2[_k];
          _results.push(typeof dep === "string" ? this.manager.lookup(dep) : dep);
        }
        return _results;
      }).call(this);
    };

    _Task.prototype._start = function() {
      var dep, _k, _len3, _ref2,
        _this = this;
      if (this.started) {
        this.log.debug("This task ('" + this._name + "') has already been started!");
        return;
      }
      if (this._depsResolved == null) {
        throw Error("Dependencies are not resolved for task '" + this._name(+"'!"));
      }
      _ref2 = this._depsResolved;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        dep = _ref2[_k];
        if (dep.state() !== "resolved") {
          this.log.debug("What am I doing here? Out of the " + this._depsResolved.length + " dependencies, '" + dep._name + "' for the current task '" + this._name + "' has not yet been resolved!");
          return;
        }
      }
      this.started = true;
      return setTimeout(function() {
        _this.dfd.notify({
          progress: 0,
          text: "Starting"
        });
        _this.dfd.startTime = new Date().getTime();
        try {
          return _this._todo(_this.dfd, _this._data);
        } catch (exception) {
          _this.log.error("Error while executing task '" + _this._name + "': " + exception);
          _this.log.error(exception);
          return _this.dfd.failed("Exception: " + exception.message);
        }
      });
    };

    _Task.prototype._skip = function(reason) {
      if (this.started) return;
      this.started = true;
      reason = "Skipping, because " + reason;
      this.dfd.notify({
        progress: 1,
        text: reason
      });
      return this.dfd._reject(this._name + " was skipped, because " + reason);
    };

    return _Task;

  })();

  _TaskGen = (function() {

    function _TaskGen(info) {
      this.manager = info.manager;
      this.name = info.name;
      this.todo = info.code;
      this.count = 0;
      this.composite = info.composite;
    }

    _TaskGen.prototype.create = function(info, useDefaultProgress) {
      var instanceInfo;
      if (useDefaultProgress == null) useDefaultProgress = true;
      this.count += 1;
      if (info == null) info = {};
      instanceInfo = {
        name: this.name + " #" + this.count + ": " + info.instanceName,
        code: this.todo,
        deps: info.deps,
        data: info.data
      };
      if (this.composite) {
        return this.manager.createComposite(instanceInfo);
      } else {
        return this.manager.create(instanceInfo, useDefaultProgress);
      }
    };

    return _TaskGen;

  })();

  _CompositeTask = (function(_super) {

    __extends(_CompositeTask, _super);

    function _CompositeTask(info) {
      var _this = this;
      if (info.code != null) {
        throw new Error("You can not specify code for a CompositeTask!");
      }
      info.code = function() {
        return _this.trigger.dfd._resolve();
      };
      _CompositeTask.__super__.constructor.call(this, info);
      this.subTasks = {};
      this.pendingSubTasks = 0;
      this.failedSubTasks = 0;
      this.failReasons = [];
      this.trigger = this.createSubTask({
        weight: 0,
        name: info.name + "__init",
        code: function(task) {}
      });
      this.lastSubTask = this.trigger;
    }

    _CompositeTask.prototype._finished = function() {
      if (this.failedSubTasks) {
        return this.dfd.failed(this.failReasons);
      } else {
        return this.dfd.ready();
      }
    };

    _CompositeTask.prototype._deleteSubTask = function(taskID) {
      delete this.subTasks[taskID];
      return this.pendingSubTasks -= 1;
    };

    _CompositeTask.prototype.addSubTask = function(info) {
      var task, weight, _ref2,
        _this = this;
      if (this.dfd.state() !== "pending") {
        throw new Error("Can not add subTask to a finished task!");
      }
      weight = (_ref2 = info.weight) != null ? _ref2 : 1;
      task = info.task;
      if (task == null) throw new Error("Trying to add subTask with no task!");
      if (this.trigger != null) task.addDeps(this.trigger);
      this.subTasks[task.taskID] = {
        name: task._name,
        weight: weight,
        progress: 0,
        text: "no info about this subtask"
      };
      this.pendingSubTasks += 1;
      task.done(function() {
        _this.pendingSubTasks -= 1;
        if (!_this.pendingSubTasks) return _this._finished();
      });
      task.fail(function(reason) {
        _this.failedSubTasks += 1;
        if (reason) _this.failReasons.push(reason);
        _this.pendingSubTasks -= 1;
        if (!_this.pendingSubTasks) return _this._finished();
      });
      task.progress(function(info) {
        var countId, countInfo, key, progress, report, taskInfo, totalWeight, value, _ref3;
        task = info.task;
        if (task === _this.trigger) return;
        taskInfo = _this.subTasks[task.taskID];
        for (key in info) {
          value = info[key];
          if (key !== "task") taskInfo[key] = value;
        }
        progress = 0;
        totalWeight = 0;
        _ref3 = _this.subTasks;
        for (countId in _ref3) {
          countInfo = _ref3[countId];
          progress += countInfo.progress * countInfo.weight;
          totalWeight += countInfo.weight;
        }
        report = {
          progress: progress / totalWeight
        };
        if (info.text != null) report.text = task._name + ": " + info.text;
        return _this.dfd.notify(report);
      });
      this.lastSubTask = task;
      return task;
    };

    _CompositeTask.prototype._getSubTaskIdByName = function(name) {
      var id, ids, info;
      ids = (function() {
        var _ref2, _results;
        _ref2 = this.subTasks;
        _results = [];
        for (id in _ref2) {
          info = _ref2[id];
          if (info.name === name) _results.push(id);
        }
        return _results;
      }).call(this);
      if (ids.length !== 0) {
        return ids[0];
      } else {
        return null;
      }
    };

    _CompositeTask.prototype.createSubTask = function(info) {
      var oldSubTaskID, w;
      w = info.weight;
      delete info.weight;
      oldSubTaskID = this._getSubTaskIdByName(info.name);
      if (oldSubTaskID != null) {
        this.log.debug("When defining sub-task '" + info.name + "', overriding this existing sub-task: " + oldSubTaskID);
        this._deleteSubTask(oldSubTaskID);
      }
      return this.addSubTask({
        weight: w,
        task: this.manager.create(info, false)
      });
    };

    _CompositeTask.prototype.createDummySubTask = function(info) {
      return this.addSubTask({
        weight: 0,
        task: this.manager.createDummy(info, false)
      });
    };

    return _CompositeTask;

  })(_Task);

  TaskManager = (function() {

    function TaskManager(name) {
      this.name = name;
      if (this.log == null) this.log = getXLogger(name + " TaskMan");
      this.defaultProgressCallbacks = [];
    }

    TaskManager.prototype.addDefaultProgress = function(callback) {
      return this.defaultProgressCallbacks.push(callback);
    };

    TaskManager.prototype.tasks = {};

    TaskManager.prototype._checkName = function(info) {
      var name;
      name = info != null ? info.name : void 0;
      if (name == null) throw new Error("Trying to create a task without a name!");
      if (this.tasks[name] != null) {
        this.log.debug("Overriding existing task '" + name + "' with new definition!");
      }
      return name;
    };

    TaskManager.prototype.create = function(info, useDefaultProgress) {
      var cb, name, task, _k, _len3, _ref2;
      if (useDefaultProgress == null) useDefaultProgress = true;
      name = this._checkName(info);
      info.manager = this;
      task = new _Task(info);
      this.tasks[task._name] = task;
      if (useDefaultProgress) {
        _ref2 = this.defaultProgressCallbacks;
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          cb = _ref2[_k];
          task.progress(cb);
        }
      }
      return task;
    };

    TaskManager.prototype.createDummy = function(info, useDefaultProgress) {
      if (useDefaultProgress == null) useDefaultProgress = true;
      info.code = function(task) {
        return task.ready();
      };
      return this.create(info, useDefaultProgress);
    };

    TaskManager.prototype.createGenerator = function(info) {
      info.manager = this;
      return new _TaskGen(info);
    };

    TaskManager.prototype.createComposite = function(info) {
      var cb, name, task, _k, _len3, _ref2;
      name = this._checkName(info);
      info.manager = this;
      task = new _CompositeTask(info);
      this.tasks[name] = task;
      _ref2 = this.defaultProgressCallbacks;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        cb = _ref2[_k];
        task.progress(cb);
      }
      return task;
    };

    TaskManager.prototype.setDeps = function(from, to) {
      return (this.lookup(from)).setDeps(to);
    };

    TaskManager.prototype.addDeps = function(from, to) {
      return (this.lookup(from)).addDeps(to);
    };

    TaskManager.prototype.removeDeps = function(from, to) {
      return (this.lookup(from)).removeDeps(to);
    };

    TaskManager.prototype.removeAllDepsTo = function(to) {
      throw new Error("Not yet implemented.");
    };

    TaskManager.prototype.lookup = function(name) {
      var result;
      result = this.tasks[name];
      if (result == null) {
        this.log.debug("Missing dependency: '" + name + "'.");
        throw new Error("Looking up non-existant task '" + name + "'.");
      }
      return result;
    };

    TaskManager.prototype.schedule = function() {
      var deps, name, p, task, _ref2;
      _ref2 = this.tasks;
      for (name in _ref2) {
        task = _ref2[name];
        if (!task.started) {
          try {
            deps = task.resolveDeps();
            if (deps.length === 0 && !task.started) {
              task._start();
            } else if (deps.length === 1) {
              deps[0].done(task._start);
              deps[0].fail(task._skip);
            } else {
              p = $.when.apply(null, deps);
              p.done(task._start);
              p.fail(task._skip);
            }
          } catch (exception) {
            this.log.debug("Could not resolve dependencies for task '" + name + "', so not scheduling it.");
          }
        }
      }
      return null;
    };

    TaskManager.prototype.dumpPending = function() {
      var dep, deps, failed, name, pending, resolved, running, t, task, _k, _len3, _ref2, _results;
      failed = (function() {
        var _ref2, _results;
        _ref2 = this.tasks;
        _results = [];
        for (name in _ref2) {
          task = _ref2[name];
          if (task.state() === "rejected") _results.push(name);
        }
        return _results;
      }).call(this);
      this.log.info("Failed tasks:", failed);
      resolved = (function() {
        var _ref2, _results;
        _ref2 = this.tasks;
        _results = [];
        for (name in _ref2) {
          task = _ref2[name];
          if (task.state() === "resolved") _results.push(name);
        }
        return _results;
      }).call(this);
      this.log.info("Finished tasks:", resolved);
      running = (function() {
        var _ref2, _results;
        _ref2 = this.tasks;
        _results = [];
        for (name in _ref2) {
          task = _ref2[name];
          if (task.state() === "pending" && task.started) _results.push(name);
        }
        return _results;
      }).call(this);
      this.log.info("Currently running tasks:", running);
      this.log.info("Waiting tasks:");
      _ref2 = this.tasks;
      _results = [];
      for (name in _ref2) {
        task = _ref2[name];
        if (!(!task.started)) continue;
        t = "Task '" + name + "'";
        this.log.info("Analyzing waiting " + t);
        try {
          deps = task.resolveDeps();
          if (deps.length === 0 && !task.started) {
            _results.push(this.log.info(t + " has no dependencies; just nobody has started it. Schedule() ? "));
          } else {
            pending = [];
            for (_k = 0, _len3 = deps.length; _k < _len3; _k++) {
              dep = deps[_k];
              if (dep.state() === "pending") pending.push(dep._name);
            }
            _results.push(this.log.info(t + ": pending dependencies: ", pending));
          }
        } catch (exception) {
          _results.push(this.log.info(t + " has unresolved dependencies", exception));
        }
      }
      return _results;
    };

    return TaskManager;

  })();

  util = {
    uuid: (function() {
      var counter;
      counter = 0;
      return function() {
        return counter++;
      };
    })(),
    getGlobal: function() {
      return (function() {
        return this;
      })();
    },
    maxZIndex: function($elements) {
      var all, el;
      all = (function() {
        var _k, _len3, _results;
        _results = [];
        for (_k = 0, _len3 = $elements.length; _k < _len3; _k++) {
          el = $elements[_k];
          if ($(el).css('position') === 'static') {
            _results.push(-1);
          } else {
            _results.push(parseInt($(el).css('z-index'), 10) || -1);
          }
        }
        return _results;
      })();
      return Math.max.apply(Math, all);
    },
    mousePosition: function(e, offsetEl) {
      var offset;
      offset = $(offsetEl).offset();
      return {
        top: e.pageY - offset.top,
        left: e.pageX - offset.left
      };
    },
    preventEventDefault: function(event) {
      return event != null ? typeof event.preventDefault === "function" ? event.preventDefault() : void 0 : void 0;
    }
  };

  _Annotator = this.Annotator;

  Annotator = (function(_super) {

    __extends(Annotator, _super);

    Annotator.prototype.events = {
      ".annotator-adder button click": "onAdderClick",
      ".annotator-adder button mousedown": "onAdderMousedown",
      ".annotator-hl mouseover": "onHighlightMouseover",
      ".annotator-hl mouseout": "startViewerHideTimer"
    };

    Annotator.prototype.html = {
      adder: '<div class="annotator-adder"><button>' + _t('Annotate') + '</button></div>',
      wrapper: '<div class="annotator-wrapper"></div>'
    };

    Annotator.prototype.options = {
      readOnly: false
    };

    Annotator.prototype.plugins = {};

    Annotator.prototype.editor = null;

    Annotator.prototype.viewer = null;

    Annotator.prototype.selectedTargets = null;

    Annotator.prototype.mouseIsDown = false;

    Annotator.prototype.ignoreMouseup = false;

    Annotator.prototype.viewerHideTimer = null;

    function Annotator(element, options) {
      this.onDeleteAnnotation = __bind(this.onDeleteAnnotation, this);
      this.onEditAnnotation = __bind(this.onEditAnnotation, this);
      this.onAdderClick = __bind(this.onAdderClick, this);
      this.onAdderMousedown = __bind(this.onAdderMousedown, this);
      this.onHighlightMouseover = __bind(this.onHighlightMouseover, this);
      this.checkForEndSelection = __bind(this.checkForEndSelection, this);
      this.checkForStartSelection = __bind(this.checkForStartSelection, this);
      this.clearViewerHideTimer = __bind(this.clearViewerHideTimer, this);
      this.startViewerHideTimer = __bind(this.startViewerHideTimer, this);
      this.showViewer = __bind(this.showViewer, this);
      this.onEditorSubmit = __bind(this.onEditorSubmit, this);
      this.onEditorHide = __bind(this.onEditorHide, this);
      this.showEditor = __bind(this.showEditor, this);
      this.getHref = __bind(this.getHref, this);
      this.defaultNotify = __bind(this.defaultNotify, this);
      var givenName, myName, _ref2,
        _this = this;
      Annotator.__super__.constructor.apply(this, arguments);
      givenName = (_ref2 = options != null ? options.annotatorName : void 0) != null ? _ref2 : "Annotator";
      if (this.log == null) this.log = getXLogger(givenName);
      this.log.debug("Annotator constructor running with options", options);
      myName = this.log.name;
      if (this.tasklog == null) this.tasklog = getXLogger(myName + " tasks");
      this.alog = getXLogger(myName + " anchoring");
      this.plugins = {};
      if (!Annotator.supported()) return;
      this.domMapper = new DomTextMapper(myName + " mapper");
      this.domMatcher = new DomTextMatcher(this.domMapper, myName + " matcher");
      this.tasks = new TaskManager(myName);
      this.tasks.addDefaultProgress(function(info) {
        return _this.defaultNotify(info);
      });
      this.loadListTaskGen = this.tasks.createGenerator({
        name: "anchoring annotation list",
        composite: true
      });
      this.loadBatchTaskGen = this.tasks.createGenerator({
        name: "anchoring annotation batch",
        code: function(task, data) {
          var n, _k, _len3, _ref3;
          _ref3 = data.annotations;
          for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
            n = _ref3[_k];
            _this.setupAnnotation(n);
          }
          return task.ready();
        }
      });
      if (!this.options.noInit) {
        if (this.options.asyncInit) {
          this.initAsync();
        } else {
          this.initSync();
        }
      }
      null;
    }

    Annotator.prototype.initSync = function() {
      this.log.debug("Doing sync init.");
      this._init = new jQuery.Deferred();
      this.init = this._init.promise();
      this._setupDynamicStyle();
      this._setupWrapper();
      this._setupViewer()._setupEditor();
      this.adder = $(this.html.adder).appendTo(this.wrapper).hide();
      if (!this.options.noScan) this._scanSync();
      if (!this.options.readOnly) this._setupDocumentEvents();
      this._init.resolve();
      return null;
    };

    Annotator.prototype.defineAsyncInitTasks = function() {
      var info, scan,
        _this = this;
      this.init = this.tasks.createComposite({
        name: "Booting Annotator"
      });
      this.init.createSubTask({
        name: "dynamic CSS styles",
        code: function(task) {
          _this._setupDynamicStyle();
          return task.ready();
        }
      });
      this.init.createSubTask({
        name: "wrapper",
        code: function(task) {
          _this._setupWrapper();
          return task.ready();
        }
      });
      this.init.createSubTask({
        name: "adder",
        deps: ["wrapper"],
        code: function(task) {
          _this.adder = $(_this.html.adder).appendTo(_this.wrapper).hide();
          return task.ready();
        }
      });
      this.init.createSubTask({
        name: "viewer & editor",
        deps: ["wrapper"],
        code: function(task) {
          _this._setupViewer()._setupEditor();
          return task.ready();
        }
      });
      this._scanGen = this.tasks.createGenerator({
        name: "scan document",
        code: function(task) {
          var s;
          s = _this._scanAsync();
          s.progress(task.notify);
          return s.done(task.ready);
        }
      });
      if (this.options.noScan) {
        scan = this.init.createDummySubTask({
          name: "Skipping scan"
        });
      } else {
        info = {
          instanceName: "Initial scan",
          deps: ["wrapper"]
        };
        scan = this._scanGen.create(info, false);
        this.init.addSubTask({
          weight: 20,
          task: scan
        });
      }
      return this.init.createSubTask({
        name: "document events",
        deps: ["wrapper", "viewer & editor", scan, "dynamic CSS styles", "adder"],
        code: function(task) {
          if (!_this.options.readOnly) _this._setupDocumentEvents();
          return task.ready();
        }
      });
    };

    Annotator.prototype.defaultNotify = function(info) {
      var num, progressText;
      if (info == null) info = {};
      if (info.progress == null) info.progress = 0;
      num = Math.round(100 * info.progress);
      progressText = num.toString() + "%";
      return this.tasklog.debug(info.task._name + ": " + progressText + " - " + info.text);
    };

    Annotator.prototype.initAsync = function() {
      this.asyncMode = true;
      this.defineAsyncInitTasks();
      return this.tasks.schedule();
    };

    Annotator.prototype._scanSync = function() {
      return this.domMatcher.scanSync();
    };

    Annotator.prototype._scanAsync = function() {
      return this.domMatcher.scanPromise();
    };

    Annotator.prototype._setupWrapper = function() {
      var _ref2;
      this.wrapper = $(this.html.wrapper);
      this.element.find('script').remove();
      this.element.wrapInner(this.wrapper);
      this.wrapper = this.element.find('.annotator-wrapper');
      if ((_ref2 = this.domMapper) != null) _ref2.setRootNode(this.wrapper[0]);
      return this;
    };

    Annotator.prototype._setupViewer = function() {
      var _this = this;
      this.viewer = new Annotator.Viewer({
        readOnly: this.options.readOnly
      });
      this.viewer.hide().on("edit", this.onEditAnnotation).on("delete", this.onDeleteAnnotation).addField({
        load: function(field, annotation) {
          if (annotation.text) {
            $(field).escape(annotation.text);
          } else {
            $(field).html("<i>" + (_t('No Comment')) + "</i>");
          }
          return _this.publish('annotationViewerTextField', [field, annotation]);
        }
      }).element.appendTo(this.wrapper).bind({
        "mouseover": this.clearViewerHideTimer,
        "mouseout": this.startViewerHideTimer
      });
      return this;
    };

    Annotator.prototype._setupEditor = function() {
      this.editor = new Annotator.Editor();
      this.editor.hide().on('hide', this.onEditorHide).on('save', this.onEditorSubmit).addField({
        type: 'textarea',
        label: _t('Comments') + '\u2026',
        load: function(field, annotation) {
          return $(field).find('textarea').val(annotation.text || '');
        },
        submit: function(field, annotation) {
          return annotation.text = $(field).find('textarea').val();
        }
      });
      this.editor.element.appendTo(this.wrapper);
      return this;
    };

    Annotator.prototype._setupDocumentEvents = function() {
      $(document).bind({
        "mouseup": this.checkForEndSelection,
        "mousedown": this.checkForStartSelection
      });
      return this;
    };

    Annotator.prototype._setupDynamicStyle = function() {
      var max, sel, style, x;
      style = $('#annotator-dynamic-style');
      if (!style.length) {
        style = $('<style id="annotator-dynamic-style"></style>').appendTo(document.head);
      }
      sel = '*' + ((function() {
        var _k, _len3, _ref2, _results;
        _ref2 = ['adder', 'outer', 'notice', 'filter'];
        _results = [];
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          x = _ref2[_k];
          _results.push(":not(.annotator-" + x + ")");
        }
        return _results;
      })()).join('');
      max = util.maxZIndex($(document.body).find(sel));
      max = Math.max(max, 1000);
      style.text([".annotator-adder, .annotator-outer, .annotator-notice {", "  z-index: " + (max + 20) + ";", "}", ".annotator-filter {", "  z-index: " + (max + 10) + ";", "}"].join("\n"));
      return this;
    };

    Annotator.prototype.getHref = function() {
      var uri;
      uri = decodeURIComponent(document.location.href);
      if (document.location.hash) uri = uri.slice(0, -1 * location.hash.length);
      $('meta[property^="og:url"]').each(function() {
        return uri = decodeURIComponent(this.content);
      });
      $('link[rel^="canonical"]').each(function() {
        return uri = decodeURIComponent(this.href);
      });
      return uri;
    };

    Annotator.prototype.getRangeSelector = function(range) {
      var selector, sr;
      sr = range.serialize(this.wrapper[0]);
      return selector = {
        type: "RangeSelector",
        startContainer: sr.startContainer,
        startOffset: sr.startOffset,
        endContainer: sr.endContainer,
        endOffset: sr.endOffset
      };
    };

    Annotator.prototype.getTextQuoteSelector = function(range) {
      var endOffset, prefix, quote, rangeEnd, rangeStart, selector, startOffset, suffix, _ref2;
      if (range == null) {
        throw new Error("Called getTextQuoteSelector(range) with null range!");
      }
      rangeStart = range.start;
      if (rangeStart == null) {
        throw new Error("Called getTextQuoteSelector(range) on a range with no valid start.");
      }
      startOffset = (this.domMapper.getInfoForNode(rangeStart)).start;
      rangeEnd = range.end;
      if (rangeEnd == null) {
        throw new Error("Called getTextQuoteSelector(range) on a range with no valid end.");
      }
      endOffset = (this.domMapper.getInfoForNode(rangeEnd)).end;
      quote = this.domMapper.getContentForCharRange(startOffset, endOffset);
      _ref2 = this.domMapper.getContextForCharRange(startOffset, endOffset), prefix = _ref2[0], suffix = _ref2[1];
      return selector = {
        type: "TextQuoteSelector",
        exact: quote,
        prefix: prefix,
        suffix: suffix
      };
    };

    Annotator.prototype.getTextPositionSelector = function(range) {
      var endOffset, selector, startOffset;
      startOffset = (this.domMapper.getInfoForNode(range.start)).start;
      endOffset = (this.domMapper.getInfoForNode(range.end)).end;
      return selector = {
        type: "TextPositionSelector",
        start: startOffset,
        end: endOffset
      };
    };

    Annotator.prototype.getQuoteForTarget = function(target) {
      var selector;
      selector = this.findSelector(target.selector, "TextQuoteSelector");
      if (selector != null) {
        return this.normalizeString(selector.exact);
      } else {
        return null;
      }
    };

    Annotator.prototype.getSelectedTargets = function() {
      var browserRange, i, normedRange, r, rangesToIgnore, realRange, selection, source, targets, _k, _len3,
        _this = this;
      if (!this.wrapper) {
        throw new Error("Can not execute getSelectedTargets() before @wrapper is configured!");
      }
      selection = util.getGlobal().getSelection();
      source = this.getHref();
      targets = [];
      rangesToIgnore = [];
      if (!selection.isCollapsed) {
        targets = (function() {
          var _ref2, _results;
          _results = [];
          for (i = 0, _ref2 = selection.rangeCount; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
            realRange = selection.getRangeAt(i);
            browserRange = new Range.BrowserRange(realRange);
            normedRange = browserRange.normalize().limit(this.wrapper[0]);
            if (normedRange === null) rangesToIgnore.push(r);
            _results.push({
              selector: [this.getRangeSelector(normedRange), this.getTextQuoteSelector(normedRange), this.getTextPositionSelector(normedRange)],
              source: source
            });
          }
          return _results;
        }).call(this);
        selection.removeAllRanges();
      }
      for (_k = 0, _len3 = rangesToIgnore.length; _k < _len3; _k++) {
        r = rangesToIgnore[_k];
        selection.addRange(r);
      }
      return $.grep(targets, function(target) {
        var range, selector;
        selector = _this.findSelector(target.selector, "RangeSelector");
        if (selector != null) {
          range = (Range.sniff(selector)).normalize(_this.wrapper[0]);
          if (range != null) {
            selection.addRange(range.toRange());
            return true;
          }
        }
      });
    };

    Annotator.prototype.createAnnotation = function() {
      var annotation;
      annotation = {};
      this.publish('beforeAnnotationCreated', [annotation]);
      return annotation;
    };

    Annotator.prototype.normalizeString = function(string) {
      return string.replace(/\s{2,}/g, " ");
    };

    Annotator.prototype.findSelector = function(selectors, type) {
      var selector, _k, _len3;
      for (_k = 0, _len3 = selectors.length; _k < _len3; _k++) {
        selector = selectors[_k];
        if (selector.type === type) return selector;
      }
      return null;
    };

    Annotator.prototype.findAnchorFromRangeSelector = function(target) {
      var content, currentQuote, endInfo, endOffset, normalizedRange, savedQuote, selector, startInfo, startOffset;
      selector = this.findSelector(target.selector, "RangeSelector");
      if (selector == null) return null;
      try {
        normalizedRange = Range.sniff(selector).normalize(this.wrapper[0]);
        savedQuote = this.getQuoteForTarget(target);
        if (savedQuote != null) {
          startInfo = this.domMapper.getInfoForNode(normalizedRange.start);
          startOffset = startInfo.start;
          endInfo = this.domMapper.getInfoForNode(normalizedRange.end);
          endOffset = endInfo.end;
          content = this.domMapper.getContentForCharRange(startOffset, endOffset);
          currentQuote = this.normalizeString(content);
          if (currentQuote !== savedQuote) {
            this.alog.debug("Could not apply XPath selector to current document             because the quote has changed. (Saved quote is '" + savedQuote + "'.             Current quote is '" + currentQuote + "'.)");
            return null;
          } else {
            this.alog.debug("Saved quote matches.");
          }
        } else {
          this.alog.debug("No saved quote, nothing to compare. Assume that it's OK.");
        }
        return {
          range: normalizedRange,
          quote: savedQuote
        };
      } catch (exception) {
        if (exception instanceof Range.RangeError) {
          this.alog.debug("Could not apply XPath selector to current document. \          The document structure may have changed.");
          return null;
        } else {
          throw exception;
        }
      }
    };

    Annotator.prototype.findAnchorFromPositionSelector = function(target) {
      var browserRange, content, currentQuote, mappings, normalizedRange, savedQuote, selector;
      selector = this.findSelector(target.selector, "TextPositionSelector");
      if (selector == null) return null;
      savedQuote = this.getQuoteForTarget(target);
      if (savedQuote != null) {
        content = this.domMapper.getContentForCharRange(selector.start, selector.end);
        currentQuote = this.normalizeString(content);
        if (currentQuote !== savedQuote) {
          this.alog.debug("Could not apply position selector to current document           because the quote has changed. (Saved quote is '" + savedQuote + "'.           Current quote is '" + currentQuote + "'.)");
          return null;
        } else {
          this.alog.debug("Saved quote matches.");
        }
      } else {
        this.alog.debug("No saved quote, nothing to compare. Assume that it's okay.");
      }
      mappings = this.domMapper.getMappingsForCharRange(selector.start, selector.end);
      browserRange = new Range.BrowserRange(mappings.realRange);
      normalizedRange = browserRange.normalize(this.wrapper[0]);
      return {
        range: normalizedRange,
        quote: savedQuote
      };
    };

    Annotator.prototype.findAnchorWithTwoPhaseFuzzyMatching = function(target) {
      var anchor, browserRange, expectedEnd, expectedStart, match, normalizedRange, options, posSelector, prefix, quote, quoteSelector, result, suffix;
      quoteSelector = this.findSelector(target.selector, "TextQuoteSelector");
      prefix = quoteSelector != null ? quoteSelector.prefix : void 0;
      suffix = quoteSelector != null ? quoteSelector.suffix : void 0;
      quote = quoteSelector != null ? quoteSelector.exact : void 0;
      if (!((prefix != null) && (suffix != null))) return null;
      posSelector = this.findSelector(target.selector, "TextPositionSelector");
      expectedStart = posSelector != null ? posSelector.start : void 0;
      expectedEnd = posSelector != null ? posSelector.end : void 0;
      options = {
        contextMatchDistance: this.domMapper.getDocLength() * 2,
        contextMatchThreshold: 0.5,
        patternMatchThreshold: 0.5
      };
      result = this.domMatcher.searchFuzzyWithContext(prefix, suffix, quote, expectedStart, expectedEnd, false, null, options);
      if (!result.matches.length) {
        this.alog.debug("Fuzzy matching did not return any results. Giving up on two-phase strategy.");
        return null;
      }
      match = result.matches[0];
      this.alog.debug("Fuzzy found match:", match);
      browserRange = new Range.BrowserRange(match.realRange);
      normalizedRange = browserRange.normalize(this.wrapper[0]);
      anchor = {
        range: normalizedRange,
        quote: !match.exact ? match.found : void 0,
        diffHTML: !match.exact ? match.comparison.diffHTML : void 0
      };
      return anchor;
    };

    Annotator.prototype.findAnchorWithFuzzyMatching = function(target) {
      var anchor, browserRange, expectedStart, len, match, normalizedRange, options, posSelector, quote, quoteSelector, result;
      quoteSelector = this.findSelector(target.selector, "TextQuoteSelector");
      quote = quoteSelector != null ? quoteSelector.exact : void 0;
      if (quote == null) return null;
      posSelector = this.findSelector(target.selector, "TextPositionSelector");
      expectedStart = posSelector != null ? posSelector.start : void 0;
      len = this.domMapper.getDocLength();
      if (expectedStart == null) expectedStart = len / 2;
      options = {
        matchDistance: len * 2,
        withFuzzyComparison: true
      };
      result = this.domMatcher.searchFuzzy(quote, expectedStart, false, null, options);
      if (!result.matches.length) {
        this.alog.debug("Fuzzy matching did not return any results. Giving up on one-phase strategy.");
        return null;
      }
      match = result.matches[0];
      this.alog.debug("Fuzzy found match:", match);
      browserRange = new Range.BrowserRange(match.realRange);
      normalizedRange = browserRange.normalize(this.wrapper[0]);
      anchor = {
        range: normalizedRange,
        quote: !match.exact ? match.found : void 0,
        diffHTML: !match.exact ? match.comparison.diffHTML : void 0
      };
      return anchor;
    };

    Annotator.prototype.findAnchor = function(target) {
      var anchor;
      if (target == null) {
        throw new Error("Trying to find anchor for null target!");
      }
      this.alog.debug("Trying to find anchor for target: ");
      this.alog.debug(target);
      anchor = this.findAnchorFromRangeSelector(target);
      if (anchor == null) anchor = this.findAnchorFromPositionSelector(target);
      if (anchor == null) {
        anchor = this.findAnchorWithTwoPhaseFuzzyMatching(target);
      }
      if (anchor == null) anchor = this.findAnchorWithFuzzyMatching(target);
      return anchor;
    };

    Annotator.prototype.setupAnnotation = function(annotation) {
      var anchor, normed, normedRanges, root, t, _k, _l, _len3, _len4, _ref2;
      this.log.trace("Setting up annotation", annotation);
      root = this.wrapper[0];
      annotation.target || (annotation.target = this.selectedTargets);
      if (annotation.target == null) {
        throw new Error("Can not run setupAnnotation(), since @selectedTargets is null!");
      }
      if (!(annotation.target instanceof Array)) {
        annotation.target = [annotation.target];
      }
      normedRanges = [];
      annotation.quote = [];
      _ref2 = annotation.target;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        t = _ref2[_k];
        try {
          anchor = this.findAnchor(t);
          t.quote = anchor.quote;
          t.diffHTML = anchor.diffHTML;
          if ((anchor != null ? anchor.range : void 0) != null) {
            normedRanges.push(anchor.range);
            annotation.quote.push(t.quote);
          } else {
            this.alog.info("Could not find anchor target for annotation '" + annotation.id + "'.");
          }
        } catch (exception) {
          this.alog.error("Internal error while anchoring", exception);
        }
      }
      annotation.ranges = [];
      annotation.highlights = [];
      for (_l = 0, _len4 = normedRanges.length; _l < _len4; _l++) {
        normed = normedRanges[_l];
        annotation.ranges.push(normed.serialize(this.wrapper[0], '.annotator-hl'));
        $.merge(annotation.highlights, this.highlightRange(normed));
      }
      annotation.quote = annotation.quote.join(' / ');
      $(annotation.highlights).data('annotation', annotation);
      return annotation;
    };

    Annotator.prototype.updateAnnotation = function(annotation) {
      this.publish('beforeAnnotationUpdated', [annotation]);
      this.publish('annotationUpdated', [annotation]);
      return annotation;
    };

    Annotator.prototype.deleteAnnotation = function(annotation) {
      var child, h, _k, _len3, _ref2;
      if (annotation.highlights != null) {
        _ref2 = annotation.highlights;
        for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
          h = _ref2[_k];
          if (!(h.parentNode != null)) continue;
          child = h.childNodes[0];
          $(h).replaceWith(h.childNodes);
          window.DomTextMapper.changed(child.parentNode, "removed hilite (annotation deleted)");
        }
      }
      this.publish('annotationDeleted', [annotation]);
      return annotation;
    };

    Annotator.prototype.loadAnnotations = function(annotations) {
      var annBatch, batchTask, from, info, to, _ref2,
        _this = this;
      if (annotations == null) annotations = [];
      if (!annotations.length) return;
      if (!this.pendingLoad) {
        this.pendingLoad = this.loadListTaskGen.create({
          instanceName: ""
        });
        this.pendingLoadList = [];
        this.pendingLoad.done(function() {
          _this.publish('annotationsLoaded', [_this.pendingLoadList]);
          return delete _this.pendingLoad;
        });
      }
      this.pendingLoadList = this.pendingLoadList.concat(annotations);
      to = 0;
      while (annotations.length) {
        annBatch = annotations.splice(0, 10);
        _ref2 = [to + 1, to + annBatch.length], from = _ref2[0], to = _ref2[1];
        info = {
          instanceName: from + "-" + to,
          data: {
            annotations: annBatch
          }
        };
        batchTask = this.loadBatchTaskGen.create(info, false);
        this.pendingLoad.addSubTask({
          deps: this.pendingLoad.lastSubTask,
          weight: annBatch.length,
          task: batchTask
        });
      }
      this.tasks.schedule();
      return this;
    };

    Annotator.prototype.dumpAnnotations = function() {
      if (this.plugins['Store']) {
        return this.plugins['Store'].dumpAnnotations();
      } else {
        return this.log.warn(_t("Can't dump annotations without Store plugin."));
      }
    };

    Annotator.prototype.highlightRange = function(normedRange, cssClass) {
      var hl, node, r, white, _k, _len3, _ref2, _results;
      if (cssClass == null) cssClass = 'annotator-hl';
      white = /^\s*$/;
      hl = $("<span class='" + cssClass + "'></span>");
      _ref2 = normedRange.textNodes();
      _results = [];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        node = _ref2[_k];
        if (!(!white.test(node.nodeValue))) continue;
        r = $(node).wrapAll(hl).parent().show()[0];
        window.DomTextMapper.changed(node, "created hilite");
        _results.push(r);
      }
      return _results;
    };

    Annotator.prototype.highlightRanges = function(normedRanges, cssClass) {
      var highlights, r, _k, _len3;
      if (cssClass == null) cssClass = 'annotator-hl';
      highlights = [];
      for (_k = 0, _len3 = normedRanges.length; _k < _len3; _k++) {
        r = normedRanges[_k];
        $.merge(highlights, this.highlightRange(r, cssClass));
      }
      return highlights;
    };

    Annotator.prototype.addPlugin = function(name, options) {
      var klass, plugin, taskInfo, _base, _ref2,
        _this = this;
      this.log.debug("Loading plugin '" + name + "'...");
      if (this.plugins[name]) {
        this.log.error(_t("You cannot have more than one instance of any plugin."));
      } else {
        klass = Annotator.Plugin[name];
        if (typeof klass === 'function') {
          this.plugins[name] = plugin = new klass(this.element[0], options);
          plugin.annotator = this;
          if (this.asyncMode) {
            taskInfo = plugin.initTaskInfo;
            if ((taskInfo != null) && !taskInfo.name) {
              taskInfo.name = "plugin " + name;
            }
            if ((!(taskInfo != null)) && (plugin.pluginInit != null)) {
              this.tasklog.trace("Plugin '" + name + "' does not have initTaskInfo. Creating init task around the synchronous pluginInit() method.");
              taskInfo = {
                name: "plugin " + name,
                deps: plugin.deps,
                code: function(task) {
                  plugin.asyncMode = true;
                  plugin.pluginInit();
                  return task.ready();
                }
              };
            }
            plugin.initTask = this.init.state() === "pending" ? ((_ref2 = taskInfo.weight) != null ? _ref2 : taskInfo.weight = 1, this.init.createSubTask(taskInfo)) : this.tasks.create(taskInfo);
            if ((options != null ? options.deps : void 0) != null) {
              plugin.initTask.addDeps(options.deps);
            }
            if (this.init.started) this.tasks.schedule();
          } else {
            this.log.debug("Synchronously initing plugin '" + name + "'.");
            if (typeof (_base = this.plugins[name]).pluginInit === "function") {
              _base.pluginInit();
            }
          }
        } else {
          this.log.error(_t("Could not load ") + name + _t(" plugin. Have you included the appropriate <script> tag?"));
        }
      }
      return this;
    };

    Annotator.prototype.showEditor = function(annotation, location) {
      this.editor.element.css(location);
      this.editor.load(annotation);
      this.publish('annotationEditorShown', [this.editor, annotation]);
      return this;
    };

    Annotator.prototype.onEditorHide = function() {
      this.publish('annotationEditorHidden', [this.editor]);
      return this.ignoreMouseup = false;
    };

    Annotator.prototype.onEditorSubmit = function(annotation) {
      return this.publish('annotationEditorSubmit', [this.editor, annotation]);
    };

    Annotator.prototype.showViewer = function(annotations, location) {
      this.viewer.element.css(location);
      this.viewer.load(annotations);
      return this.publish('annotationViewerShown', [this.viewer, annotations]);
    };

    Annotator.prototype.startViewerHideTimer = function() {
      if (!this.viewerHideTimer) {
        return this.viewerHideTimer = setTimeout(this.viewer.hide, 250);
      }
    };

    Annotator.prototype.clearViewerHideTimer = function() {
      clearTimeout(this.viewerHideTimer);
      return this.viewerHideTimer = false;
    };

    Annotator.prototype.checkForStartSelection = function(event) {
      if (!(event && this.isAnnotator(event.target))) {
        this.startViewerHideTimer();
        return this.mouseIsDown = true;
      }
    };

    Annotator.prototype.checkForEndSelection = function(event) {
      var container, range, selector, target, _k, _len3, _ref2;
      this.mouseIsDown = false;
      if (this.ignoreMouseup) return;
      try {
        this.selectedTargets = this.getSelectedTargets();
      } catch (exception) {
        this.alog.error("While checking selection:", exception);
        alert("There is something very strange about the current selection. Sorry, but I can not annotate this.");
        return;
      }
      _ref2 = this.selectedTargets;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        target = _ref2[_k];
        selector = this.findSelector(target.selector, "RangeSelector");
        range = (Range.sniff(selector)).normalize(this.wrapper[0]);
        container = range.commonAncestor;
        if ($(container).hasClass('annotator-hl')) {
          container = $(container).parents('[class^=annotator-hl]')[0];
        }
        if (this.isAnnotator(container)) return;
      }
      if (event && this.selectedTargets.length) {
        return this.adder.css(util.mousePosition(event, this.wrapper[0])).show();
      } else {
        return this.adder.hide();
      }
    };

    Annotator.prototype.isAnnotator = function(element) {
      return !!$(element).parents().andSelf().filter('[class^=annotator-]').not(this.wrapper).length;
    };

    Annotator.prototype.onHighlightMouseover = function(event) {
      var annotations;
      this.clearViewerHideTimer();
      if (this.mouseIsDown || this.viewer.isShown()) return false;
      annotations = $(event.target).parents('.annotator-hl').andSelf().map(function() {
        return $(this).data("annotation");
      });
      return this.showViewer($.makeArray(annotations), util.mousePosition(event, this.wrapper[0]));
    };

    Annotator.prototype.onAdderMousedown = function(event) {
      if (event != null) event.preventDefault();
      return this.ignoreMouseup = true;
    };

    Annotator.prototype.onAdderClick = function(event) {
      var annotation, cancel, cleanup, position, save,
        _this = this;
      if (event != null) event.preventDefault();
      position = this.adder.position();
      this.adder.hide();
      annotation = this.createAnnotation();
      annotation = this.setupAnnotation(annotation);
      $(annotation.highlights).addClass('annotator-hl-temporary');
      save = function() {
        cleanup();
        $(annotation.highlights).removeClass('annotator-hl-temporary');
        return _this.publish('annotationCreated', [annotation]);
      };
      cancel = function() {
        cleanup();
        return _this.deleteAnnotation(annotation);
      };
      cleanup = function() {
        _this.unsubscribe('annotationEditorHidden', cancel);
        return _this.unsubscribe('annotationEditorSubmit', save);
      };
      this.subscribe('annotationEditorHidden', cancel);
      this.subscribe('annotationEditorSubmit', save);
      return this.showEditor(annotation, position);
    };

    Annotator.prototype.onEditAnnotation = function(annotation) {
      var cleanup, offset, update,
        _this = this;
      offset = this.viewer.element.position();
      update = function() {
        cleanup();
        return _this.updateAnnotation(annotation);
      };
      cleanup = function() {
        _this.unsubscribe('annotationEditorHidden', cleanup);
        return _this.unsubscribe('annotationEditorSubmit', update);
      };
      this.subscribe('annotationEditorHidden', cleanup);
      this.subscribe('annotationEditorSubmit', update);
      this.viewer.hide();
      return this.showEditor(annotation, offset);
    };

    Annotator.prototype.onDeleteAnnotation = function(annotation) {
      this.viewer.hide();
      return this.deleteAnnotation(annotation);
    };

    return Annotator;

  })(Delegator);

  Annotator.Plugin = (function(_super) {

    __extends(Plugin, _super);

    function Plugin(element, options) {
      Plugin.__super__.constructor.apply(this, arguments);
    }

    Plugin.prototype.pluginInit = function() {};

    return Plugin;

  })(Delegator);

  g = util.getGlobal();

  if (!(((_ref2 = g.document) != null ? _ref2.evaluate : void 0) != null)) {
    $.getScript('http://assets.annotateit.org/vendor/xpath.min.js');
  }

  if (!(g.getSelection != null)) {
    $.getScript('http://assets.annotateit.org/vendor/ierange.min.js');
  }

  if (!(g.JSON != null)) {
    $.getScript('http://assets.annotateit.org/vendor/json2.min.js');
  }

  Annotator.$ = $;

  Annotator.Delegator = Delegator;

  Annotator.Range = Range;

  Annotator._t = _t;

  Annotator.supported = function() {
    return (function() {
      return !!this.getSelection;
    })();
  };

  Annotator.noConflict = function() {
    util.getGlobal().Annotator = _Annotator;
    return this;
  };

  $.plugin('annotator', Annotator);

  this.Annotator = Annotator;

  Annotator.Widget = (function(_super) {

    __extends(Widget, _super);

    Widget.prototype.classes = {
      hide: 'annotator-hide',
      invert: {
        x: 'annotator-invert-x',
        y: 'annotator-invert-y'
      }
    };

    function Widget(element, options) {
      Widget.__super__.constructor.apply(this, arguments);
      this.classes = $.extend({}, Annotator.Widget.prototype.classes, this.classes);
    }

    Widget.prototype.checkOrientation = function() {
      var current, offset, viewport, widget, window;
      this.resetOrientation();
      window = $(util.getGlobal());
      widget = this.element.children(":first");
      offset = widget.offset();
      viewport = {
        top: window.scrollTop(),
        right: window.width() + window.scrollLeft()
      };
      current = {
        top: offset.top,
        right: offset.left + widget.width()
      };
      if ((current.top - viewport.top) < 0) this.invertY();
      if ((current.right - viewport.right) > 0) this.invertX();
      return this;
    };

    Widget.prototype.resetOrientation = function() {
      this.element.removeClass(this.classes.invert.x).removeClass(this.classes.invert.y);
      return this;
    };

    Widget.prototype.invertX = function() {
      this.element.addClass(this.classes.invert.x);
      return this;
    };

    Widget.prototype.invertY = function() {
      this.element.addClass(this.classes.invert.y);
      return this;
    };

    Widget.prototype.isInvertedY = function() {
      return this.element.hasClass(this.classes.invert.y);
    };

    Widget.prototype.isInvertedX = function() {
      return this.element.hasClass(this.classes.invert.x);
    };

    return Widget;

  })(Delegator);

  Annotator.Editor = (function(_super) {

    __extends(Editor, _super);

    Editor.prototype.events = {
      "form submit": "submit",
      ".annotator-save click": "submit",
      ".annotator-cancel click": "hide",
      ".annotator-cancel mouseover": "onCancelButtonMouseover",
      "textarea keydown": "processKeypress"
    };

    Editor.prototype.classes = {
      hide: 'annotator-hide',
      focus: 'annotator-focus'
    };

    Editor.prototype.html = "<div class=\"annotator-outer annotator-editor\">\n  <form class=\"annotator-widget\">\n    <ul class=\"annotator-listing\"></ul>\n    <div class=\"annotator-controls\">\n      <a href=\"#cancel\" class=\"annotator-cancel\">" + _t('Cancel') + "</a>\n<a href=\"#save\" class=\"annotator-save annotator-focus\">" + _t('Save') + "</a>\n    </div>\n  </form>\n</div>";

    Editor.prototype.options = {};

    function Editor(options) {
      this.onCancelButtonMouseover = __bind(this.onCancelButtonMouseover, this);
      this.processKeypress = __bind(this.processKeypress, this);
      this.submit = __bind(this.submit, this);
      this.load = __bind(this.load, this);
      this.hide = __bind(this.hide, this);
      this.show = __bind(this.show, this);      Editor.__super__.constructor.call(this, $(this.html)[0], options);
      this.fields = [];
      this.annotation = {};
    }

    Editor.prototype.show = function(event) {
      util.preventEventDefault(event);
      this.element.removeClass(this.classes.hide);
      this.element.find('.annotator-save').addClass(this.classes.focus);
      this.checkOrientation();
      this.element.find(":input:first").focus();
      this.setupDraggables();
      return this.publish('show');
    };

    Editor.prototype.hide = function(event) {
      util.preventEventDefault(event);
      this.element.addClass(this.classes.hide);
      return this.publish('hide');
    };

    Editor.prototype.load = function(annotation) {
      var field, _k, _len3, _ref3;
      this.annotation = annotation;
      this.publish('load', [this.annotation]);
      _ref3 = this.fields;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        field = _ref3[_k];
        field.load(field.element, this.annotation);
      }
      return this.show();
    };

    Editor.prototype.submit = function(event) {
      var field, _k, _len3, _ref3;
      util.preventEventDefault(event);
      _ref3 = this.fields;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        field = _ref3[_k];
        field.submit(field.element, this.annotation);
      }
      this.publish('save', [this.annotation]);
      return this.hide();
    };

    Editor.prototype.addField = function(options) {
      var element, field, input;
      field = $.extend({
        id: 'annotator-field-' + util.uuid(),
        type: 'input',
        label: '',
        load: function() {},
        submit: function() {}
      }, options);
      input = null;
      element = $('<li class="annotator-item" />');
      field.element = element[0];
      switch (field.type) {
        case 'textarea':
          input = $('<textarea />');
          break;
        case 'input':
        case 'checkbox':
          input = $('<input />');
      }
      element.append(input);
      input.attr({
        id: field.id,
        placeholder: field.label
      });
      if (field.type === 'checkbox') {
        input[0].type = 'checkbox';
        element.addClass('annotator-checkbox');
        element.append($('<label />', {
          "for": field.id,
          html: field.label
        }));
      }
      this.element.find('ul:first').append(element);
      this.fields.push(field);
      return field.element;
    };

    Editor.prototype.checkOrientation = function() {
      var controls, list;
      Editor.__super__.checkOrientation.apply(this, arguments);
      list = this.element.find('ul');
      controls = this.element.find('.annotator-controls');
      if (this.element.hasClass(this.classes.invert.y)) {
        controls.insertBefore(list);
      } else if (controls.is(':first-child')) {
        controls.insertAfter(list);
      }
      return this;
    };

    Editor.prototype.processKeypress = function(event) {
      if (event.keyCode === 27) {
        return this.hide();
      } else if (event.keyCode === 13 && !event.shiftKey) {
        return this.submit();
      }
    };

    Editor.prototype.onCancelButtonMouseover = function() {
      return this.element.find('.' + this.classes.focus).removeClass(this.classes.focus);
    };

    Editor.prototype.setupDraggables = function() {
      var classes, controls, cornerItem, editor, mousedown, onMousedown, onMousemove, onMouseup, resize, textarea, throttle,
        _this = this;
      this.element.find('.annotator-resize').remove();
      if (this.element.hasClass(this.classes.invert.y)) {
        cornerItem = this.element.find('.annotator-item:last');
      } else {
        cornerItem = this.element.find('.annotator-item:first');
      }
      if (cornerItem) {
        $('<span class="annotator-resize"></span>').appendTo(cornerItem);
      }
      mousedown = null;
      classes = this.classes;
      editor = this.element;
      textarea = null;
      resize = editor.find('.annotator-resize');
      controls = editor.find('.annotator-controls');
      throttle = false;
      onMousedown = function(event) {
        if (event.target === this) {
          mousedown = {
            element: this,
            top: event.pageY,
            left: event.pageX
          };
          textarea = editor.find('textarea:first');
          $(window).bind({
            'mouseup.annotator-editor-resize': onMouseup,
            'mousemove.annotator-editor-resize': onMousemove
          });
          return event.preventDefault();
        }
      };
      onMouseup = function() {
        mousedown = null;
        return $(window).unbind('.annotator-editor-resize');
      };
      onMousemove = function(event) {
        var diff, directionX, directionY, height, width;
        if (mousedown && throttle === false) {
          diff = {
            top: event.pageY - mousedown.top,
            left: event.pageX - mousedown.left
          };
          if (mousedown.element === resize[0]) {
            height = textarea.outerHeight();
            width = textarea.outerWidth();
            directionX = editor.hasClass(classes.invert.x) ? -1 : 1;
            directionY = editor.hasClass(classes.invert.y) ? 1 : -1;
            textarea.height(height + (diff.top * directionY));
            textarea.width(width + (diff.left * directionX));
            if (textarea.outerHeight() !== height) mousedown.top = event.pageY;
            if (textarea.outerWidth() !== width) mousedown.left = event.pageX;
          } else if (mousedown.element === controls[0]) {
            editor.css({
              top: parseInt(editor.css('top'), 10) + diff.top,
              left: parseInt(editor.css('left'), 10) + diff.left
            });
            mousedown.top = event.pageY;
            mousedown.left = event.pageX;
          }
          throttle = true;
          return setTimeout(function() {
            return throttle = false;
          }, 1000 / 60);
        }
      };
      resize.bind('mousedown', onMousedown);
      return controls.bind('mousedown', onMousedown);
    };

    return Editor;

  })(Annotator.Widget);

  Annotator.Viewer = (function(_super) {

    __extends(Viewer, _super);

    Viewer.prototype.events = {
      ".annotator-edit click": "onEditClick",
      ".annotator-delete click": "onDeleteClick"
    };

    Viewer.prototype.classes = {
      hide: 'annotator-hide',
      showControls: 'annotator-visible'
    };

    Viewer.prototype.html = {
      element: "<div class=\"annotator-outer annotator-viewer\">\n  <ul class=\"annotator-widget annotator-listing\"></ul>\n</div>",
      item: "<li class=\"annotator-annotation annotator-item\">\n  <span class=\"annotator-controls\">\n    <a href=\"#\" title=\"View as webpage\" class=\"annotator-link\">View as webpage</a>\n    <button title=\"Edit\" class=\"annotator-edit\">Edit</button>\n    <button title=\"Delete\" class=\"annotator-delete\">Delete</button>\n  </span>\n</li>"
    };

    Viewer.prototype.options = {
      readOnly: false
    };

    function Viewer(options) {
      this.onDeleteClick = __bind(this.onDeleteClick, this);
      this.onEditClick = __bind(this.onEditClick, this);
      this.load = __bind(this.load, this);
      this.hide = __bind(this.hide, this);
      this.show = __bind(this.show, this);      Viewer.__super__.constructor.call(this, $(this.html.element)[0], options);
      this.item = $(this.html.item)[0];
      this.fields = [];
      this.annotations = [];
    }

    Viewer.prototype.show = function(event) {
      var controls,
        _this = this;
      util.preventEventDefault(event);
      controls = this.element.find('.annotator-controls').addClass(this.classes.showControls);
      setTimeout((function() {
        return controls.removeClass(_this.classes.showControls);
      }), 500);
      this.element.removeClass(this.classes.hide);
      return this.checkOrientation().publish('show');
    };

    Viewer.prototype.isShown = function() {
      return !this.element.hasClass(this.classes.hide);
    };

    Viewer.prototype.hide = function(event) {
      util.preventEventDefault(event);
      this.element.addClass(this.classes.hide);
      return this.publish('hide');
    };

    Viewer.prototype.load = function(annotations) {
      var annotation, controller, controls, del, edit, element, field, item, link, links, list, _k, _l, _len3, _len4, _ref3, _ref4;
      this.annotations = annotations || [];
      list = this.element.find('ul:first').empty();
      _ref3 = this.annotations;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        annotation = _ref3[_k];
        item = $(this.item).clone().appendTo(list).data('annotation', annotation);
        controls = item.find('.annotator-controls');
        link = controls.find('.annotator-link');
        edit = controls.find('.annotator-edit');
        del = controls.find('.annotator-delete');
        links = new LinkParser(annotation.links || []).get('alternate', {
          'type': 'text/html'
        });
        if (links.length === 0 || !(links[0].href != null)) {
          link.remove();
        } else {
          link.attr('href', links[0].href);
        }
        if (this.options.readOnly) {
          edit.remove();
          del.remove();
        } else {
          controller = {
            showEdit: function() {
              return edit.removeAttr('disabled');
            },
            hideEdit: function() {
              return edit.attr('disabled', 'disabled');
            },
            showDelete: function() {
              return del.removeAttr('disabled');
            },
            hideDelete: function() {
              return del.attr('disabled', 'disabled');
            }
          };
        }
        _ref4 = this.fields;
        for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
          field = _ref4[_l];
          element = $(field.element).clone().appendTo(item)[0];
          field.load(element, annotation, controller);
        }
      }
      this.publish('load', [this.annotations]);
      return this.show();
    };

    Viewer.prototype.addField = function(options) {
      var field;
      field = $.extend({
        load: function() {}
      }, options);
      field.element = $('<div />')[0];
      this.fields.push(field);
      field.element;
      return this;
    };

    Viewer.prototype.onEditClick = function(event) {
      return this.onButtonClick(event, 'edit');
    };

    Viewer.prototype.onDeleteClick = function(event) {
      return this.onButtonClick(event, 'delete');
    };

    Viewer.prototype.onButtonClick = function(event, type) {
      var item;
      item = $(event.target).parents('.annotator-annotation');
      return this.publish(type, [item.data('annotation')]);
    };

    return Viewer;

  })(Annotator.Widget);

  LinkParser = (function() {

    function LinkParser(data) {
      this.data = data;
    }

    LinkParser.prototype.get = function(rel, cond) {
      var d, k, keys, match, v, _k, _len3, _ref3, _results;
      if (cond == null) cond = {};
      cond = $.extend({}, cond, {
        rel: rel
      });
      keys = (function() {
        var _results;
        _results = [];
        for (k in cond) {
          if (!__hasProp.call(cond, k)) continue;
          v = cond[k];
          _results.push(k);
        }
        return _results;
      })();
      _ref3 = this.data;
      _results = [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        d = _ref3[_k];
        match = keys.reduce((function(m, k) {
          return m && (d[k] === cond[k]);
        }), true);
        if (match) {
          _results.push(d);
        } else {
          continue;
        }
      }
      return _results;
    };

    return LinkParser;

  })();

  Annotator = Annotator || {};

  Annotator.Notification = (function(_super) {

    __extends(Notification, _super);

    Notification.prototype.events = {
      "click": "hide"
    };

    Notification.prototype.options = {
      html: "<div class='annotator-notice'></div>",
      classes: {
        show: "annotator-notice-show",
        info: "annotator-notice-info",
        success: "annotator-notice-success",
        error: "annotator-notice-error"
      }
    };

    function Notification(options) {
      this.hide = __bind(this.hide, this);
      this.show = __bind(this.show, this);      Notification.__super__.constructor.call(this, $(this.options.html).appendTo(document.body)[0], options);
    }

    Notification.prototype.show = function(message, status) {
      if (status == null) status = Annotator.Notification.INFO;
      $(this.element).addClass(this.options.classes.show).addClass(this.options.classes[status]).escape(message || "");
      setTimeout(this.hide, 5000);
      return this;
    };

    Notification.prototype.hide = function() {
      $(this.element).removeClass(this.options.classes.show);
      return this;
    };

    return Notification;

  })(Delegator);

  Annotator.Notification.INFO = 'show';

  Annotator.Notification.SUCCESS = 'success';

  Annotator.Notification.ERROR = 'error';

  $(function() {
    var notification;
    notification = new Annotator.Notification;
    Annotator.showNotification = notification.show;
    return Annotator.hideNotification = notification.hide;
  });

}).call(this);
