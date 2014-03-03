(function() {
    var modules = {}, definitions = {};
    var _require = function(path) {
        if (modules[path]) return modules[path];
        var module = {
            exports: {}
        }, definition = definitions[path];
        if (!definition) {
            try {
                return require(path);
            } catch (e) {}
            throw new Error("unable to load " + path);
        }
        return modules[path] = module.exports = definition(_require, module, module.exports, path);
    };
    var define = function(path, definition) {
        definitions[path] = definition;
    };

    define("adm-zip/adm-zip.js", function(require, module, exports, __dirname, __filename) {
        var fs = require("fs"), pth = require("path");
        fs.existsSync = fs.existsSync || pth.existsSync;
        var ZipEntry = require("adm-zip/zipEntry.js"), ZipFile = require("adm-zip/zipFile.js"), Utils = require("adm-zip/util/index.js");
        module.exports = function(input) {
            var _zip = undefined, _filename = "";
            if (input && typeof input === "string") {
                if (fs.existsSync(input)) {
                    _filename = input;
                    _zip = new ZipFile(input, Utils.Constants.FILE);
                } else {
                    throw Utils.Errors.INVALID_FILENAME;
                }
            } else if (input && Buffer.isBuffer(input)) {
                _zip = new ZipFile(input, Utils.Constants.BUFFER);
            } else {
                _zip = new ZipFile(null, Utils.Constants.NONE);
            }
            function getEntry(entry) {
                if (entry && _zip) {
                    var item;
                    if (typeof entry === "string") item = _zip.getEntry(entry);
                    if (typeof entry === "object" && entry.entryName != undefined && entry.header != undefined) item = _zip.getEntry(entry.entryName);
                    if (item) {
                        return item;
                    }
                }
                return null;
            }
            return {
                readFile: function(entry) {
                    var item = getEntry(entry);
                    return item && item.getData() || null;
                },
                readFileAsync: function(entry, callback) {
                    var item = getEntry(entry);
                    if (item) {
                        item.getDataAsync(callback);
                    } else {
                        callback(null, "getEntry failed for:" + entry);
                    }
                },
                readAsText: function(entry, encoding) {
                    var item = getEntry(entry);
                    if (item) {
                        var data = item.getData();
                        if (data && data.length) {
                            return data.toString(encoding || "utf8");
                        }
                    }
                    return "";
                },
                readAsTextAsync: function(entry, callback, encoding) {
                    var item = getEntry(entry);
                    if (item) {
                        item.getDataAsync(function(data) {
                            if (data && data.length) {
                                callback(data.toString(encoding || "utf8"));
                            } else {
                                callback("");
                            }
                        });
                    } else {
                        callback("");
                    }
                },
                deleteFile: function(entry) {
                    var item = getEntry(entry);
                    if (item) {
                        _zip.deleteEntry(item.entryName);
                    }
                },
                addZipComment: function(comment) {
                    _zip.comment = comment;
                },
                getZipComment: function() {
                    return _zip.comment || "";
                },
                addZipEntryComment: function(entry, comment) {
                    var item = getEntry(entry);
                    if (item) {
                        item.comment = comment;
                    }
                },
                getZipEntryComment: function(entry) {
                    var item = getEntry(entry);
                    if (item) {
                        return item.comment || "";
                    }
                    return "";
                },
                updateFile: function(entry, content) {
                    var item = getEntry(entry);
                    if (item) {
                        item.setData(content);
                    }
                },
                addLocalFile: function(localPath, zipPath) {
                    if (fs.existsSync(localPath)) {
                        if (zipPath) {
                            zipPath = zipPath.split("\\").join("/");
                            if (zipPath.charAt(zipPath.length - 1) != "/") {
                                zipPath += "/";
                            }
                        } else {
                            zipPath = "";
                        }
                        var p = localPath.split("\\").join("/").split("/").pop();
                        this.addFile(zipPath + p, fs.readFileSync(localPath), "", 0);
                    } else {
                        throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
                    }
                },
                addLocalFolder: function(localPath, zipPath) {
                    if (zipPath) {
                        zipPath = zipPath.split("\\").join("/");
                        if (zipPath.charAt(zipPath.length - 1) != "/") {
                            zipPath += "/";
                        }
                    } else {
                        zipPath = "";
                    }
                    localPath = localPath.split("\\").join("/");
                    if (localPath.charAt(localPath.length - 1) != "/") localPath += "/";
                    if (fs.existsSync(localPath)) {
                        var items = Utils.findFiles(localPath), self = this;
                        if (items.length) {
                            items.forEach(function(path) {
                                var p = path.split("\\").join("/").replace(localPath, "");
                                if (p.charAt(p.length - 1) !== "/") {
                                    self.addFile(zipPath + p, fs.readFileSync(path), "", 0);
                                } else {
                                    self.addFile(zipPath + p, new Buffer(0), "", 0);
                                }
                            });
                        }
                    } else {
                        throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
                    }
                },
                addFile: function(entryName, content, comment, attr) {
                    var entry = new ZipEntry;
                    entry.entryName = entryName;
                    entry.comment = comment || "";
                    entry.attr = attr || 438;
                    if (entry.isDirectory && content.length) {}
                    entry.setData(content);
                    _zip.setEntry(entry);
                },
                getEntries: function() {
                    if (_zip) {
                        return _zip.entries;
                    } else {
                        return [];
                    }
                },
                getEntry: function(name) {
                    return getEntry(name);
                },
                extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite) {
                    overwrite = overwrite || false;
                    maintainEntryPath = typeof maintainEntryPath == "undefined" ? true : maintainEntryPath;
                    var item = getEntry(entry);
                    if (!item) {
                        throw Utils.Errors.NO_ENTRY;
                    }
                    var target = pth.resolve(targetPath, maintainEntryPath ? item.entryName : pth.basename(item.entryName));
                    if (item.isDirectory) {
                        target = pth.resolve(target, "..");
                        var children = _zip.getEntryChildren(item);
                        children.forEach(function(child) {
                            if (child.isDirectory) return;
                            var content = child.getData();
                            if (!content) {
                                throw Utils.Errors.CANT_EXTRACT_FILE;
                            }
                            Utils.writeFileTo(pth.resolve(targetPath, maintainEntryPath ? child.entryName : child.entryName.substr(item.entryName.length)), content, overwrite);
                        });
                        return true;
                    }
                    var content = item.getData();
                    if (!content) throw Utils.Errors.CANT_EXTRACT_FILE;
                    if (fs.existsSync(targetPath) && !overwrite) {
                        throw Utils.Errors.CANT_OVERRIDE;
                    }
                    Utils.writeFileTo(target, content, overwrite);
                    return true;
                },
                extractAllTo: function(targetPath, overwrite) {
                    overwrite = overwrite || false;
                    if (!_zip) {
                        throw Utils.Errors.NO_ZIP;
                    }
                    _zip.entries.forEach(function(entry) {
                        if (entry.isDirectory) {
                            Utils.makeDir(pth.resolve(targetPath, entry.entryName.toString()));
                            return;
                        }
                        var content = entry.getData();
                        if (!content) {
                            throw Utils.Errors.CANT_EXTRACT_FILE + "2";
                        }
                        Utils.writeFileTo(pth.resolve(targetPath, entry.entryName.toString()), content, overwrite);
                    });
                },
                writeZip: function(targetFileName, callback) {
                    if (arguments.length == 1) {
                        if (typeof targetFileName == "function") {
                            callback = targetFileName;
                            targetFileName = "";
                        }
                    }
                    if (!targetFileName && _filename) {
                        targetFileName = _filename;
                    }
                    if (!targetFileName) return;
                    var zipData = _zip.compressToBuffer();
                    if (zipData) {
                        Utils.writeFileTo(targetFileName, zipData, true);
                    }
                },
                toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
                    this.valueOf = 2;
                    if (typeof onSuccess == "function") {
                        _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
                        return null;
                    }
                    return _zip.compressToBuffer();
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/zipEntry.js", function(require, module, exports, __dirname, __filename) {
        var Utils = require("adm-zip/util/index.js"), Headers = require("adm-zip/headers/index.js"), Constants = Utils.Constants, Methods = require("adm-zip/methods/index.js");
        module.exports = function(input) {
            var _entryHeader = new Headers.EntryHeader, _entryName = new Buffer(0), _comment = new Buffer(0), _isDirectory = false, uncompressedData = null, _extra = new Buffer(0);
            function getCompressedDataFromZip() {
                if (!input || !Buffer.isBuffer(input)) {
                    return new Buffer(0);
                }
                _entryHeader.loadDataHeaderFromBinary(input);
                return input.slice(_entryHeader.realDataOffset, _entryHeader.realDataOffset + _entryHeader.compressedSize);
            }
            function crc32OK(data) {
                if (_entryHeader.flags & 8 != 8) {
                    if (Utils.crc32(data) != _entryHeader.crc) {
                        return false;
                    }
                } else {}
                return true;
            }
            function decompress(async, callback) {
                if (_isDirectory) {
                    if (async && callback) {
                        callback(new Buffer(0), Utils.Errors.DIRECTORY_CONTENT_ERROR);
                    }
                    return new Buffer(0);
                }
                var compressedData = getCompressedDataFromZip();
                if (compressedData.length == 0) {
                    if (async && callback) callback(compressedData, Utils.Errors.NO_DATA);
                    return compressedData;
                }
                var data = new Buffer(_entryHeader.size);
                data.fill(0);
                switch (_entryHeader.method) {
                  case Utils.Constants.STORED:
                    compressedData.copy(data);
                    if (!crc32OK(data)) {
                        if (async && callback) callback(data, Utils.Errors.BAD_CRC);
                        return Utils.Errors.BAD_CRC;
                    } else {
                        if (async && callback) callback(data);
                        return data;
                    }
                    break;
                  case Utils.Constants.DEFLATED:
                    var inflater = new Methods.Inflater(compressedData);
                    if (!async) {
                        inflater.inflate(data);
                        if (!crc32OK(data)) {
                            console.warn(Utils.Errors.BAD_CRC + " " + _entryName.toString());
                        }
                        return data;
                    } else {
                        inflater.inflateAsync(function(result) {
                            result.copy(data, 0);
                            if (crc32OK(data)) {
                                if (callback) callback(data, Utils.Errors.BAD_CRC);
                            } else {
                                if (callback) callback(data);
                            }
                        });
                    }
                    break;
                  default:
                    if (async && callback) callback(new Buffer(0), Utils.Errors.UNKNOWN_METHOD);
                    return Utils.Errors.UNKNOWN_METHOD;
                }
            }
            function compress(async, callback) {
                if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
                    if (async && callback) callback(getCompressedDataFromZip());
                    return getCompressedDataFromZip();
                }
                if (uncompressedData.length && !_isDirectory) {
                    var compressedData;
                    switch (_entryHeader.method) {
                      case Utils.Constants.STORED:
                        _entryHeader.compressedSize = _entryHeader.size;
                        compressedData = new Buffer(uncompressedData.length);
                        uncompressedData.copy(compressedData);
                        if (async && callback) callback(compressedData);
                        return compressedData;
                        break;
                      default:
                      case Utils.Constants.DEFLATED:
                        var deflater = new Methods.Deflater(uncompressedData);
                        if (!async) {
                            var deflated = deflater.deflate();
                            _entryHeader.compressedSize = deflated.length;
                            return deflated;
                        } else {
                            deflater.deflateAsync(function(data) {
                                compressedData = new Buffer(data.length);
                                _entryHeader.compressedSize = data.length;
                                data.copy(compressedData);
                                callback && callback(compressedData);
                            });
                        }
                        deflater = null;
                        break;
                    }
                } else {
                    if (async && callback) {
                        callback(new Buffer(0));
                    } else {
                        return new Buffer(0);
                    }
                }
            }
            return {
                get entryName() {
                    return _entryName.toString();
                },
                get rawEntryName() {
                    return _entryName;
                },
                set entryName(val) {
                    _entryName = Utils.toBuffer(val);
                    var lastChar = _entryName[_entryName.length - 1];
                    _isDirectory = lastChar == 47 || lastChar == 92;
                    _entryHeader.fileNameLength = _entryName.length;
                },
                get extra() {
                    return _extra;
                },
                set extra(val) {
                    _extra = val;
                    _entryHeader.extraLength = val.length;
                },
                get comment() {
                    return _comment.toString();
                },
                set comment(val) {
                    _comment = Utils.toBuffer(val);
                    _entryHeader.commentLength = _comment.length;
                },
                get name() {
                    var n = _entryName.toString();
                    return _isDirectory ? n.substr(n.length - 1).split("/").pop() : n.split("/").pop();
                },
                get isDirectory() {
                    return _isDirectory;
                },
                getCompressedData: function() {
                    return compress(false, null);
                },
                getCompressedDataAsync: function(callback) {
                    compress(true, callback);
                },
                setData: function(value) {
                    uncompressedData = Utils.toBuffer(value);
                    if (!_isDirectory && uncompressedData.length) {
                        _entryHeader.size = uncompressedData.length;
                        _entryHeader.method = Utils.Constants.DEFLATED;
                        _entryHeader.crc = Utils.crc32(value);
                    } else {
                        _entryHeader.method = Utils.Constants.STORED;
                    }
                },
                getData: function() {
                    return decompress(false, null);
                },
                getDataAsync: function(callback) {
                    decompress(true, callback);
                },
                set header(data) {
                    _entryHeader.loadFromBinary(data);
                },
                get header() {
                    return _entryHeader;
                },
                packHeader: function() {
                    var header = _entryHeader.entryHeaderToBinary();
                    _entryName.copy(header, Utils.Constants.CENHDR);
                    if (_entryHeader.extraLength) {
                        _extra.copy(header, Utils.Constants.CENHDR + _entryName.length);
                    }
                    if (_entryHeader.commentLength) {
                        _comment.copy(header, Utils.Constants.CENHDR + _entryName.length + _entryHeader.extraLength, _comment.length);
                    }
                    return header;
                },
                toString: function() {
                    return "{\n" + '	"entryName" : "' + _entryName.toString() + '",\n' + '	"name" : "' + _entryName.toString().split("/").pop() + '",\n' + '	"comment" : "' + _comment.toString() + '",\n' + '	"isDirectory" : ' + _isDirectory + ",\n" + '	"header" : ' + _entryHeader.toString().replace(/\t/mg, "		") + ",\n" + '	"compressedData" : <' + (input && input.length + " bytes buffer" || "null") + ">\n" + '	"data" : <' + (uncompressedData && uncompressedData.length + " bytes buffer" || "null") + ">\n" + "}";
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/zipFile.js", function(require, module, exports, __dirname, __filename) {
        var ZipEntry = require("adm-zip/zipEntry.js"), Headers = require("adm-zip/headers/index.js"), Utils = require("adm-zip/util/index.js");
        module.exports = function(input, inputType) {
            var entryList = [], entryTable = {}, _comment = new Buffer(0), filename = "", fs = require("fs"), inBuffer = null, mainHeader = new Headers.MainHeader;
            if (inputType == Utils.Constants.FILE) {
                filename = input;
                inBuffer = fs.readFileSync(filename);
                readMainHeader();
            } else if (inputType == Utils.Constants.BUFFER) {
                inBuffer = input;
                readMainHeader();
            } else {}
            function readEntries() {
                entryTable = {};
                entryList = new Array(mainHeader.diskEntries);
                var index = mainHeader.offset;
                for (var i = 0; i < entryList.length; i++) {
                    var tmp = index, entry = new ZipEntry(inBuffer);
                    entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
                    entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
                    if (entry.header.extraLength) {
                        entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
                    }
                    if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
                    index += entry.header.entryHeaderSize;
                    entryList[i] = entry;
                    entryTable[entry.entryName] = entry;
                }
            }
            function readMainHeader() {
                var i = inBuffer.length - Utils.Constants.ENDHDR, n = Math.max(0, i - 65535), endOffset = 0;
                for (i; i >= n; i--) {
                    if (inBuffer[i] != 80) continue;
                    if (inBuffer.readUInt32LE(i) == Utils.Constants.ENDSIG) {
                        endOffset = i;
                        break;
                    }
                }
                if (!endOffset) throw Utils.Errors.INVALID_FORMAT;
                mainHeader.loadFromBinary(inBuffer.slice(endOffset, endOffset + Utils.Constants.ENDHDR));
                if (mainHeader.commentLength) {
                    _comment = inBuffer.slice(endOffset + Utils.Constants.ENDHDR);
                }
                readEntries();
            }
            return {
                get entries() {
                    return entryList;
                },
                get comment() {
                    return _comment.toString();
                },
                set comment(val) {
                    mainHeader.commentLength = val.length;
                    _comment = val;
                },
                getEntry: function(entryName) {
                    return entryTable[entryName] || null;
                },
                setEntry: function(entry) {
                    entryList.push(entry);
                    entryTable[entry.entryName] = entry;
                    mainHeader.totalEntries = entryList.length;
                },
                deleteEntry: function(entryName) {
                    var entry = entryTable[entryName];
                    if (entry && entry.isDirectory) {
                        var _self = this;
                        this.getEntryChildren(entry).forEach(function(child) {
                            if (child.entryName != entryName) {
                                _self.deleteEntry(child.entryName);
                            }
                        });
                    }
                    entryList.splice(entryList.indexOf(entry), 1);
                    delete entryTable[entryName];
                    mainHeader.totalEntries = entryList.length;
                },
                getEntryChildren: function(entry) {
                    if (entry.isDirectory) {
                        var list = [], name = entry.entryName, len = name.length;
                        entryList.forEach(function(zipEntry) {
                            if (zipEntry.entryName.substr(0, len) == name) {
                                list.push(zipEntry);
                            }
                        });
                        return list;
                    }
                    return [];
                },
                compressToBuffer: function() {
                    if (entryList.length > 1) {
                        entryList.sort(function(a, b) {
                            var nameA = a.entryName.toLowerCase();
                            var nameB = b.entryName.toLowerCase();
                            if (nameA < nameB) {
                                return -1;
                            }
                            if (nameA > nameB) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                    var totalSize = 0, dataBlock = [], entryHeaders = [], dindex = 0;
                    mainHeader.size = 0;
                    mainHeader.offset = 0;
                    entryList.forEach(function(entry) {
                        entry.header.offset = dindex;
                        var compressedData = entry.getCompressedData();
                        var dataHeader = entry.header.dataHeaderToBinary();
                        var postHeader = new Buffer(entry.entryName + entry.extra.toString());
                        var dataLength = dataHeader.length + postHeader.length + compressedData.length;
                        dindex += dataLength;
                        dataBlock.push(dataHeader);
                        dataBlock.push(postHeader);
                        dataBlock.push(compressedData);
                        var entryHeader = entry.packHeader();
                        entryHeaders.push(entryHeader);
                        mainHeader.size += entryHeader.length;
                        totalSize += dataLength + entryHeader.length;
                    });
                    totalSize += mainHeader.mainHeaderSize;
                    mainHeader.offset = dindex;
                    dindex = 0;
                    var outBuffer = new Buffer(totalSize);
                    dataBlock.forEach(function(content) {
                        content.copy(outBuffer, dindex);
                        dindex += content.length;
                    });
                    entryHeaders.forEach(function(content) {
                        content.copy(outBuffer, dindex);
                        dindex += content.length;
                    });
                    var mh = mainHeader.toBinary();
                    if (_comment) {
                        _comment.copy(mh, Utils.Constants.ENDHDR);
                    }
                    mh.copy(outBuffer, dindex);
                    return outBuffer;
                },
                toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
                    if (entryList.length > 1) {
                        entryList.sort(function(a, b) {
                            var nameA = a.entryName.toLowerCase();
                            var nameB = b.entryName.toLowerCase();
                            if (nameA > nameB) {
                                return -1;
                            }
                            if (nameA < nameB) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                    var totalSize = 0, dataBlock = [], entryHeaders = [], dindex = 0;
                    mainHeader.size = 0;
                    mainHeader.offset = 0;
                    var compress = function(entryList) {
                        var self = arguments.callee;
                        var entry;
                        if (entryList.length) {
                            var entry = entryList.pop();
                            var name = entry.entryName + entry.extra.toString();
                            if (onItemStart) onItemStart(name);
                            entry.getCompressedDataAsync(function(compressedData) {
                                if (onItemEnd) onItemEnd(name);
                                entry.header.offset = dindex;
                                var dataHeader = entry.header.dataHeaderToBinary();
                                var postHeader = new Buffer(name);
                                var dataLength = dataHeader.length + postHeader.length + compressedData.length;
                                dindex += dataLength;
                                dataBlock.push(dataHeader);
                                dataBlock.push(postHeader);
                                dataBlock.push(compressedData);
                                var entryHeader = entry.packHeader();
                                entryHeaders.push(entryHeader);
                                mainHeader.size += entryHeader.length;
                                totalSize += dataLength + entryHeader.length;
                                if (entryList.length) {
                                    self(entryList);
                                } else {
                                    totalSize += mainHeader.mainHeaderSize;
                                    mainHeader.offset = dindex;
                                    dindex = 0;
                                    var outBuffer = new Buffer(totalSize);
                                    dataBlock.forEach(function(content) {
                                        content.copy(outBuffer, dindex);
                                        dindex += content.length;
                                    });
                                    entryHeaders.forEach(function(content) {
                                        content.copy(outBuffer, dindex);
                                        dindex += content.length;
                                    });
                                    var mh = mainHeader.toBinary();
                                    if (_comment) {
                                        _comment.copy(mh, Utils.Constants.ENDHDR);
                                    }
                                    mh.copy(outBuffer, dindex);
                                    onSuccess(outBuffer);
                                }
                            });
                        }
                    };
                    compress(entryList);
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/util/index.js", function(require, module, exports, __dirname, __filename) {
        module.exports = require("adm-zip/util/utils.js");
        module.exports.Constants = require("adm-zip/util/constants.js");
        module.exports.Errors = require("adm-zip/util/errors.js");
        module.exports.FileAttr = require("adm-zip/util/fattr.js");
        return module.exports;
    });
    define("adm-zip/headers/index.js", function(require, module, exports, __dirname, __filename) {
        exports.EntryHeader = require("adm-zip/headers/entryHeader.js");
        exports.MainHeader = require("adm-zip/headers/mainHeader.js");
        return module.exports;
    });
    define("adm-zip/methods/index.js", function(require, module, exports, __dirname, __filename) {
        exports.Deflater = require("adm-zip/methods/deflater.js");
        exports.Inflater = require("adm-zip/methods/inflater.js");
        return module.exports;
    });
    define("adm-zip/util/utils.js", function(require, module, exports, __dirname, __filename) {
        var fs = require("fs"), pth = require("path");
        fs.existsSync = fs.existsSync || pth.existsSync;
        module.exports = function() {
            var crcTable = [], Constants = require("adm-zip/util/constants.js"), Errors = require("adm-zip/util/errors.js"), PATH_SEPARATOR = pth.normalize("/");
            function mkdirSync(path) {
                var resolvedPath = path.split(PATH_SEPARATOR)[0];
                path.split(PATH_SEPARATOR).forEach(function(name) {
                    if (!name || name.substr(-1, 1) == ":") return;
                    resolvedPath += PATH_SEPARATOR + name;
                    var stat;
                    try {
                        stat = fs.statSync(resolvedPath);
                    } catch (e) {
                        fs.mkdirSync(resolvedPath);
                    }
                    if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY.replace("%s", resolvedPath);
                });
            }
            function findSync(root, pattern, recoursive) {
                if (typeof pattern === "boolean") {
                    recoursive = pattern;
                    pattern = undefined;
                }
                var files = [];
                fs.readdirSync(root).forEach(function(file) {
                    var path = pth.join(root, file);
                    if (fs.statSync(path).isDirectory() && recoursive) files = files.concat(findSync(path, pattern, recoursive));
                    if (!pattern || pattern.test(path)) {
                        files.push(pth.normalize(path) + (fs.statSync(path).isDirectory() ? PATH_SEPARATOR : ""));
                    }
                });
                return files;
            }
            return {
                makeDir: function(path) {
                    mkdirSync(path);
                },
                crc32: function(buf) {
                    var b = new Buffer(4);
                    if (!crcTable.length) {
                        for (var n = 0; n < 256; n++) {
                            var c = n;
                            for (var k = 8; --k >= 0; ) if ((c & 1) != 0) {
                                c = 3988292384 ^ c >>> 1;
                            } else {
                                c = c >>> 1;
                            }
                            if (c < 0) {
                                b.writeInt32LE(c, 0);
                                c = b.readUInt32LE(0);
                            }
                            crcTable[n] = c;
                        }
                    }
                    var crc = 0, off = 0, len = buf.length, c1 = ~crc;
                    while (--len >= 0) c1 = crcTable[(c1 ^ buf[off++]) & 255] ^ c1 >>> 8;
                    crc = ~c1;
                    b.writeInt32LE(crc & 4294967295, 0);
                    return b.readUInt32LE(0);
                },
                methodToString: function(method) {
                    switch (method) {
                      case Constants.STORED:
                        return "STORED (" + method + ")";
                      case Constants.DEFLATED:
                        return "DEFLATED (" + method + ")";
                      default:
                        return "UNSUPPORTED (" + method + ")";
                    }
                },
                writeFileTo: function(path, content, overwrite, attr) {
                    if (fs.existsSync(path)) {
                        if (!overwrite) return false;
                        var stat = fs.statSync(path);
                        if (stat.isDirectory()) {
                            return false;
                        }
                    }
                    var folder = pth.dirname(path);
                    if (!fs.existsSync(folder)) {
                        mkdirSync(folder);
                    }
                    var fd;
                    try {
                        fd = fs.openSync(path, "w", 438);
                    } catch (e) {
                        fs.chmodSync(path, 438);
                        fd = fs.openSync(path, "w", 438);
                    }
                    if (fd) {
                        fs.writeSync(fd, content, 0, content.length, 0);
                        fs.closeSync(fd);
                    }
                    fs.chmodSync(path, attr || 438);
                    return true;
                },
                findFiles: function(path) {
                    return findSync(path, true);
                },
                getAttributes: function(path) {},
                setAttributes: function(path) {},
                toBuffer: function(input) {
                    if (Buffer.isBuffer(input)) {
                        return input;
                    } else {
                        if (input.length == 0) {
                            return new Buffer(0);
                        }
                        return new Buffer(input, "utf8");
                    }
                },
                Constants: Constants,
                Errors: Errors
            };
        }();
        return module.exports;
    });
    define("adm-zip/util/constants.js", function(require, module, exports, __dirname, __filename) {
        module.exports = {
            LOCHDR: 30,
            LOCSIG: 67324752,
            LOCVER: 4,
            LOCFLG: 6,
            LOCHOW: 8,
            LOCTIM: 10,
            LOCCRC: 14,
            LOCSIZ: 18,
            LOCLEN: 22,
            LOCNAM: 26,
            LOCEXT: 28,
            EXTSIG: 134695760,
            EXTHDR: 16,
            EXTCRC: 4,
            EXTSIZ: 8,
            EXTLEN: 12,
            CENHDR: 46,
            CENSIG: 33639248,
            CENVEM: 4,
            CENVER: 6,
            CENFLG: 8,
            CENHOW: 10,
            CENTIM: 12,
            CENCRC: 16,
            CENSIZ: 20,
            CENLEN: 24,
            CENNAM: 28,
            CENEXT: 30,
            CENCOM: 32,
            CENDSK: 34,
            CENATT: 36,
            CENATX: 38,
            CENOFF: 42,
            ENDHDR: 22,
            ENDSIG: 101010256,
            ENDSUB: 8,
            ENDTOT: 10,
            ENDSIZ: 12,
            ENDOFF: 16,
            ENDCOM: 20,
            STORED: 0,
            SHRUNK: 1,
            REDUCED1: 2,
            REDUCED2: 3,
            REDUCED3: 4,
            REDUCED4: 5,
            IMPLODED: 6,
            DEFLATED: 8,
            ENHANCED_DEFLATED: 9,
            PKWARE: 10,
            BZIP2: 12,
            LZMA: 14,
            IBM_TERSE: 18,
            IBM_LZ77: 19,
            FLG_ENC: 0,
            FLG_COMP1: 1,
            FLG_COMP2: 2,
            FLG_DESC: 4,
            FLG_ENH: 8,
            FLG_STR: 16,
            FLG_LNG: 1024,
            FLG_MSK: 4096,
            FILE: 0,
            BUFFER: 1,
            NONE: 2
        };
        return module.exports;
    });
    define("adm-zip/util/errors.js", function(require, module, exports, __dirname, __filename) {
        module.exports = {
            INVALID_LOC: "Invalid LOC header (bad signature)",
            INVALID_CEN: "Invalid CEN header (bad signature)",
            INVALID_END: "Invalid END header (bad signature)",
            NO_DATA: "Nothing to decompress",
            BAD_CRC: "CRC32 checksum failed",
            FILE_IN_THE_WAY: "There is a file in the way: %s",
            UNKNOWN_METHOD: "Invalid/unsupported compression method",
            AVAIL_DATA: "inflate::Available inflate data did not terminate",
            INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
            TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
            INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
            INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
            INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
            INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
            INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
            INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
            INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
            CANT_EXTRACT_FILE: "Could not extract the file",
            CANT_OVERRIDE: "Target file already exists",
            NO_ZIP: "No zip file was loaded",
            NO_ENTRY: "Entry doesn't exist",
            DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
            FILE_NOT_FOUND: "File not found: %s",
            NOT_IMPLEMENTED: "Not implemented",
            INVALID_FILENAME: "Invalid filename",
            INVALID_FORMAT: "Invalid or unsupported zip format. No END header found"
        };
        return module.exports;
    });
    define("adm-zip/util/fattr.js", function(require, module, exports, __dirname, __filename) {
        var fs = require("fs"), pth = require("path");
        fs.existsSync = fs.existsSync || pth.existsSync;
        module.exports = function(path) {
            var _path = path || "", _permissions = 0, _obj = newAttr(), _stat = null;
            function newAttr() {
                return {
                    directory: false,
                    readonly: false,
                    hidden: false,
                    executable: false,
                    mtime: 0,
                    atime: 0
                };
            }
            if (_path && fs.existsSync(_path)) {
                _stat = fs.statSync(_path);
                _obj.directory = _stat.isDirectory();
                _obj.mtime = _stat.mtime;
                _obj.atime = _stat.atime;
                _obj.executable = !!(1 & parseInt((_stat.mode & parseInt("777", 8)).toString(8)[0]));
                _obj.readonly = !!(2 & parseInt((_stat.mode & parseInt("777", 8)).toString(8)[0]));
                _obj.hidden = pth.basename(_path)[0] === ".";
            } else {
                console.warn("Invalid path: " + _path);
            }
            return {
                get directory() {
                    return _obj.directory;
                },
                get readOnly() {
                    return _obj.readonly;
                },
                get hidden() {
                    return _obj.hidden;
                },
                get mtime() {
                    return _obj.mtime;
                },
                get atime() {
                    return _obj.atime;
                },
                get executable() {
                    return _obj.executable;
                },
                decodeAttributes: function(val) {},
                encodeAttributes: function(val) {},
                toString: function() {
                    return "{\n" + '	"path" : "' + _path + ",\n" + '	"isDirectory" : ' + _obj.directory + ",\n" + '	"isReadOnly" : ' + _obj.readonly + ",\n" + '	"isHidden" : ' + _obj.hidden + ",\n" + '	"isExecutable" : ' + _obj.executable + ",\n" + '	"mTime" : ' + _obj.mtime + "\n" + '	"aTime" : ' + _obj.atime + "\n" + "}";
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/headers/entryHeader.js", function(require, module, exports, __dirname, __filename) {
        var Utils = require("adm-zip/util/index.js"), Constants = Utils.Constants;
        module.exports = function() {
            var _verMade = 10, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
            var _dataHeader = {};
            function setTime(val) {
                var val = new Date(val);
                _time = (val.getFullYear() - 1980 & 127) << 25 | val.getMonth() + 1 << 21 | val.getDay() << 16 | val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
            }
            setTime(+(new Date));
            return {
                get made() {
                    return _verMade;
                },
                set made(val) {
                    _verMade = val;
                },
                get version() {
                    return _version;
                },
                set version(val) {
                    _version = val;
                },
                get flags() {
                    return _flags;
                },
                set flags(val) {
                    _flags = val;
                },
                get method() {
                    return _method;
                },
                set method(val) {
                    _method = val;
                },
                get time() {
                    return new Date((_time >> 25 & 127) + 1980, (_time >> 21 & 15) - 1, _time >> 16 & 31, _time >> 11 & 31, _time >> 5 & 63, (_time & 31) << 1);
                },
                set time(val) {
                    setTime(val);
                },
                get crc() {
                    return _crc;
                },
                set crc(val) {
                    _crc = val;
                },
                get compressedSize() {
                    return _compressedSize;
                },
                set compressedSize(val) {
                    _compressedSize = val;
                },
                get size() {
                    return _size;
                },
                set size(val) {
                    _size = val;
                },
                get fileNameLength() {
                    return _fnameLen;
                },
                set fileNameLength(val) {
                    _fnameLen = val;
                },
                get extraLength() {
                    return _extraLen;
                },
                set extraLength(val) {
                    _extraLen = val;
                },
                get commentLength() {
                    return _comLen;
                },
                set commentLength(val) {
                    _comLen = val;
                },
                get diskNumStart() {
                    return _diskStart;
                },
                set diskNumStart(val) {
                    _diskStart = val;
                },
                get inAttr() {
                    return _inattr;
                },
                set inAttr(val) {
                    _inattr = val;
                },
                get attr() {
                    return _attr;
                },
                set attr(val) {
                    _attr = val;
                },
                get offset() {
                    return _offset;
                },
                set offset(val) {
                    _offset = val;
                },
                get encripted() {
                    return (_flags & 1) == 1;
                },
                get entryHeaderSize() {
                    return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
                },
                get realDataOffset() {
                    return _offset + Constants.LOCHDR + _dataHeader.fnameLen + _dataHeader.extraLen;
                },
                get dataHeader() {
                    return _dataHeader;
                },
                loadDataHeaderFromBinary: function(input) {
                    var data = input.slice(_offset, _offset + Constants.LOCHDR);
                    if (data.readUInt32LE(0) != Constants.LOCSIG) {
                        throw Utils.Errors.INVALID_LOC;
                    }
                    _dataHeader = {
                        version: data.readUInt16LE(Constants.LOCVER),
                        flags: data.readUInt16LE(Constants.LOCFLG),
                        method: data.readUInt16LE(Constants.LOCHOW),
                        time: data.readUInt32LE(Constants.LOCTIM),
                        crc: data.readUInt32LE(Constants.LOCCRC),
                        compressedSize: data.readUInt32LE(Constants.LOCSIZ),
                        size: data.readUInt32LE(Constants.LOCLEN),
                        fnameLen: data.readUInt16LE(Constants.LOCNAM),
                        extraLen: data.readUInt16LE(Constants.LOCEXT)
                    };
                },
                loadFromBinary: function(data) {
                    if (data.length != Constants.CENHDR || data.readUInt32LE(0) != Constants.CENSIG) {
                        throw Utils.Errors.INVALID_CEN;
                    }
                    _verMade = data.readUInt16LE(Constants.CENVEM);
                    _version = data.readUInt16LE(Constants.CENVER);
                    _flags = data.readUInt16LE(Constants.CENFLG);
                    _method = data.readUInt16LE(Constants.CENHOW);
                    _time = data.readUInt32LE(Constants.CENTIM);
                    _crc = data.readUInt32LE(Constants.CENCRC);
                    _compressedSize = data.readUInt32LE(Constants.CENSIZ);
                    _size = data.readUInt32LE(Constants.CENLEN);
                    _fnameLen = data.readUInt16LE(Constants.CENNAM);
                    _extraLen = data.readUInt16LE(Constants.CENEXT);
                    _comLen = data.readUInt16LE(Constants.CENCOM);
                    _diskStart = data.readUInt16LE(Constants.CENDSK);
                    _inattr = data.readUInt16LE(Constants.CENATT);
                    _attr = data.readUInt32LE(Constants.CENATX);
                    _offset = data.readUInt32LE(Constants.CENOFF);
                },
                dataHeaderToBinary: function() {
                    var data = new Buffer(Constants.LOCHDR);
                    data.writeUInt32LE(Constants.LOCSIG, 0);
                    data.writeUInt16LE(_version, Constants.LOCVER);
                    data.writeUInt16LE(_flags, Constants.LOCFLG);
                    data.writeUInt16LE(_method, Constants.LOCHOW);
                    data.writeUInt32LE(_time, Constants.LOCTIM);
                    data.writeUInt32LE(_crc, Constants.LOCCRC);
                    data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
                    data.writeUInt32LE(_size, Constants.LOCLEN);
                    data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
                    data.writeUInt16LE(_extraLen, Constants.LOCEXT);
                    return data;
                },
                entryHeaderToBinary: function() {
                    var data = new Buffer(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
                    data.writeUInt32LE(Constants.CENSIG, 0);
                    data.writeUInt16LE(_verMade, Constants.CENVEM);
                    data.writeUInt16LE(_version, Constants.CENVER);
                    data.writeUInt16LE(_flags, Constants.CENFLG);
                    data.writeUInt16LE(_method, Constants.CENHOW);
                    data.writeUInt32LE(_time, Constants.CENTIM);
                    data.writeInt32LE(_crc, Constants.CENCRC, true);
                    data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
                    data.writeUInt32LE(_size, Constants.CENLEN);
                    data.writeUInt16LE(_fnameLen, Constants.CENNAM);
                    data.writeUInt16LE(_extraLen, Constants.CENEXT);
                    data.writeUInt16LE(_comLen, Constants.CENCOM);
                    data.writeUInt16LE(_diskStart, Constants.CENDSK);
                    data.writeUInt16LE(_inattr, Constants.CENATT);
                    data.writeUInt32LE(_attr, Constants.CENATX);
                    data.writeUInt32LE(_offset, Constants.CENOFF);
                    data.fill(0, Constants.CENHDR);
                    return data;
                },
                toString: function() {
                    return "{\n" + '	"made" : ' + _verMade + ",\n" + '	"version" : ' + _version + ",\n" + '	"flags" : ' + _flags + ",\n" + '	"method" : ' + Utils.methodToString(_method) + ",\n" + '	"time" : ' + _time + ",\n" + '	"crc" : 0x' + _crc.toString(16).toUpperCase() + ",\n" + '	"compressedSize" : ' + _compressedSize + " bytes,\n" + '	"size" : ' + _size + " bytes,\n" + '	"fileNameLength" : ' + _fnameLen + ",\n" + '	"extraLength" : ' + _extraLen + " bytes,\n" + '	"commentLength" : ' + _comLen + " bytes,\n" + '	"diskNumStart" : ' + _diskStart + ",\n" + '	"inAttr" : ' + _inattr + ",\n" + '	"attr" : ' + _attr + ",\n" + '	"offset" : ' + _offset + ",\n" + '	"entryHeaderSize" : ' + (Constants.CENHDR + _fnameLen + _extraLen + _comLen) + " bytes\n" + "}";
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/headers/mainHeader.js", function(require, module, exports, __dirname, __filename) {
        var Utils = require("adm-zip/util/index.js"), Constants = Utils.Constants;
        module.exports = function() {
            var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
            return {
                get diskEntries() {
                    return _volumeEntries;
                },
                set diskEntries(val) {
                    _volumeEntries = _totalEntries = val;
                },
                get totalEntries() {
                    return _totalEntries;
                },
                set totalEntries(val) {
                    _totalEntries = _volumeEntries = val;
                },
                get size() {
                    return _size;
                },
                set size(val) {
                    _size = val;
                },
                get offset() {
                    return _offset;
                },
                set offset(val) {
                    _offset = val;
                },
                get commentLength() {
                    return _commentLength;
                },
                set commentLength(val) {
                    _commentLength = val;
                },
                get mainHeaderSize() {
                    return Constants.ENDHDR + _commentLength;
                },
                loadFromBinary: function(data) {
                    if (data.length != Constants.ENDHDR || data.readUInt32LE(0) != Constants.ENDSIG) throw Utils.Errors.INVALID_END;
                    _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
                    _totalEntries = data.readUInt16LE(Constants.ENDTOT);
                    _size = data.readUInt32LE(Constants.ENDSIZ);
                    _offset = data.readUInt32LE(Constants.ENDOFF);
                    _commentLength = data.readUInt16LE(Constants.ENDCOM);
                },
                toBinary: function() {
                    var b = new Buffer(Constants.ENDHDR + _commentLength);
                    b.writeUInt32LE(Constants.ENDSIG, 0);
                    b.writeUInt32LE(0, 4);
                    b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
                    b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
                    b.writeUInt32LE(_size, Constants.ENDSIZ);
                    b.writeUInt32LE(_offset, Constants.ENDOFF);
                    b.writeUInt16LE(_commentLength, Constants.ENDCOM);
                    b.fill(" ", Constants.ENDHDR);
                    return b;
                },
                toString: function() {
                    return "{\n" + '	"diskEntries" : ' + _volumeEntries + ",\n" + '	"totalEntries" : ' + _totalEntries + ",\n" + '	"size" : ' + _size + " bytes,\n" + '	"offset" : 0x' + _offset.toString(16).toUpperCase() + ",\n" + '	"commentLength" : 0x' + _commentLength + "\n" + "}";
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/methods/deflater.js", function(require, module, exports, __dirname, __filename) {
        function JSDeflater(inbuf) {
            var WSIZE = 32768, zip_STORED_BLOCK = 0, zip_STATIC_TREES = 1, zip_DYN_TREES = 2, zip_DEFAULT_LEVEL = 6, zip_FULL_SEARCH = true, zip_INBUFSIZ = 32768, zip_INBUF_EXTRA = 64, zip_OUTBUFSIZ = 1024 * 8, zip_window_size = 2 * WSIZE, MIN_MATCH = 3, MAX_MATCH = 258, zip_BITS = 16, LIT_BUFSIZE = 8192, zip_HASH_BITS = 13, zip_DIST_BUFSIZE = LIT_BUFSIZE, zip_HASH_SIZE = 1 << zip_HASH_BITS, zip_HASH_MASK = zip_HASH_SIZE - 1, zip_WMASK = WSIZE - 1, zip_NIL = 0, zip_TOO_FAR = 4096, zip_MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1, zip_MAX_DIST = WSIZE - zip_MIN_LOOKAHEAD, zip_SMALLEST = 1, zip_MAX_BITS = 15, zip_MAX_BL_BITS = 7, zip_LENGTH_CODES = 29, zip_LITERALS = 256, zip_END_BLOCK = 256, zip_L_CODES = zip_LITERALS + 1 + zip_LENGTH_CODES, zip_D_CODES = 30, zip_BL_CODES = 19, zip_REP_3_6 = 16, zip_REPZ_3_10 = 17, zip_REPZ_11_138 = 18, zip_HEAP_SIZE = 2 * zip_L_CODES + 1, zip_H_SHIFT = parseInt((zip_HASH_BITS + MIN_MATCH - 1) / MIN_MATCH);
            var zip_free_queue, zip_qhead, zip_qtail, zip_initflag, zip_outbuf = null, zip_outcnt, zip_outoff, zip_complete, zip_window, zip_d_buf, zip_l_buf, zip_prev, zip_bi_buf, zip_bi_valid, zip_block_start, zip_ins_h, zip_hash_head, zip_prev_match, zip_match_available, zip_match_length, zip_prev_length, zip_strstart, zip_match_start, zip_eofile, zip_lookahead, zip_max_chain_length, zip_max_lazy_match, zip_compr_level, zip_good_match, zip_nice_match, zip_dyn_ltree, zip_dyn_dtree, zip_static_ltree, zip_static_dtree, zip_bl_tree, zip_l_desc, zip_d_desc, zip_bl_desc, zip_bl_count, zip_heap, zip_heap_len, zip_heap_max, zip_depth, zip_length_code, zip_dist_code, zip_base_length, zip_base_dist, zip_flag_buf, zip_last_lit, zip_last_dist, zip_last_flags, zip_flags, zip_flag_bit, zip_opt_len, zip_static_len, zip_deflate_data, zip_deflate_pos;
            var zip_DeflateCT = function() {
                this.fc = 0;
                this.dl = 0;
            };
            var zip_DeflateTreeDesc = function() {
                this.dyn_tree = null;
                this.static_tree = null;
                this.extra_bits = null;
                this.extra_base = 0;
                this.elems = 0;
                this.max_length = 0;
                this.max_code = 0;
            };
            var zip_DeflateConfiguration = function(a, b, c, d) {
                this.good_length = a;
                this.max_lazy = b;
                this.nice_length = c;
                this.max_chain = d;
            };
            var zip_DeflateBuffer = function() {
                this.next = null;
                this.len = 0;
                this.ptr = new Array(zip_OUTBUFSIZ);
                this.off = 0;
            };
            var zip_extra_lbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0);
            var zip_extra_dbits = new Array(0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
            var zip_extra_blbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7);
            var zip_bl_order = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
            var zip_configuration_table = new Array(new zip_DeflateConfiguration(0, 0, 0, 0), new zip_DeflateConfiguration(4, 4, 8, 4), new zip_DeflateConfiguration(4, 5, 16, 8), new zip_DeflateConfiguration(4, 6, 32, 32), new zip_DeflateConfiguration(4, 4, 16, 16), new zip_DeflateConfiguration(8, 16, 32, 32), new zip_DeflateConfiguration(8, 16, 128, 128), new zip_DeflateConfiguration(8, 32, 128, 256), new zip_DeflateConfiguration(32, 128, 258, 1024), new zip_DeflateConfiguration(32, 258, 258, 4096));
            var zip_deflate_start = function(level) {
                var i;
                if (!level) level = zip_DEFAULT_LEVEL; else if (level < 1) level = 1; else if (level > 9) level = 9;
                zip_compr_level = level;
                zip_initflag = false;
                zip_eofile = false;
                if (zip_outbuf != null) return;
                zip_free_queue = zip_qhead = zip_qtail = null;
                zip_outbuf = new Array(zip_OUTBUFSIZ);
                zip_window = new Array(zip_window_size);
                zip_d_buf = new Array(zip_DIST_BUFSIZE);
                zip_l_buf = new Array(zip_INBUFSIZ + zip_INBUF_EXTRA);
                zip_prev = new Array(1 << zip_BITS);
                zip_dyn_ltree = new Array(zip_HEAP_SIZE);
                for (i = 0; i < zip_HEAP_SIZE; i++) zip_dyn_ltree[i] = new zip_DeflateCT;
                zip_dyn_dtree = new Array(2 * zip_D_CODES + 1);
                for (i = 0; i < 2 * zip_D_CODES + 1; i++) zip_dyn_dtree[i] = new zip_DeflateCT;
                zip_static_ltree = new Array(zip_L_CODES + 2);
                for (i = 0; i < zip_L_CODES + 2; i++) zip_static_ltree[i] = new zip_DeflateCT;
                zip_static_dtree = new Array(zip_D_CODES);
                for (i = 0; i < zip_D_CODES; i++) zip_static_dtree[i] = new zip_DeflateCT;
                zip_bl_tree = new Array(2 * zip_BL_CODES + 1);
                for (i = 0; i < 2 * zip_BL_CODES + 1; i++) zip_bl_tree[i] = new zip_DeflateCT;
                zip_l_desc = new zip_DeflateTreeDesc;
                zip_d_desc = new zip_DeflateTreeDesc;
                zip_bl_desc = new zip_DeflateTreeDesc;
                zip_bl_count = new Array(zip_MAX_BITS + 1);
                zip_heap = new Array(2 * zip_L_CODES + 1);
                zip_depth = new Array(2 * zip_L_CODES + 1);
                zip_length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
                zip_dist_code = new Array(512);
                zip_base_length = new Array(zip_LENGTH_CODES);
                zip_base_dist = new Array(zip_D_CODES);
                zip_flag_buf = new Array(parseInt(LIT_BUFSIZE / 8));
            };
            var zip_deflate_end = function() {
                zip_free_queue = zip_qhead = zip_qtail = null;
                zip_outbuf = null;
                zip_window = null;
                zip_d_buf = null;
                zip_l_buf = null;
                zip_prev = null;
                zip_dyn_ltree = null;
                zip_dyn_dtree = null;
                zip_static_ltree = null;
                zip_static_dtree = null;
                zip_bl_tree = null;
                zip_l_desc = null;
                zip_d_desc = null;
                zip_bl_desc = null;
                zip_bl_count = null;
                zip_heap = null;
                zip_depth = null;
                zip_length_code = null;
                zip_dist_code = null;
                zip_base_length = null;
                zip_base_dist = null;
                zip_flag_buf = null;
            };
            var zip_reuse_queue = function(p) {
                p.next = zip_free_queue;
                zip_free_queue = p;
            };
            var zip_new_queue = function() {
                var p;
                if (zip_free_queue != null) {
                    p = zip_free_queue;
                    zip_free_queue = zip_free_queue.next;
                } else p = new zip_DeflateBuffer;
                p.next = null;
                p.len = p.off = 0;
                return p;
            };
            var zip_head1 = function(i) {
                return zip_prev[WSIZE + i];
            };
            var zip_head2 = function(i, val) {
                return zip_prev[WSIZE + i] = val;
            };
            var zip_put_byte = function(c) {
                zip_outbuf[zip_outoff + zip_outcnt++] = c;
                if (zip_outoff + zip_outcnt == zip_OUTBUFSIZ) zip_qoutbuf();
            };
            var zip_put_short = function(w) {
                w &= 65535;
                if (zip_outoff + zip_outcnt < zip_OUTBUFSIZ - 2) {
                    zip_outbuf[zip_outoff + zip_outcnt++] = w & 255;
                    zip_outbuf[zip_outoff + zip_outcnt++] = w >>> 8;
                } else {
                    zip_put_byte(w & 255);
                    zip_put_byte(w >>> 8);
                }
            };
            var zip_INSERT_STRING = function() {
                zip_ins_h = (zip_ins_h << zip_H_SHIFT ^ zip_window[zip_strstart + MIN_MATCH - 1] & 255) & zip_HASH_MASK;
                zip_hash_head = zip_head1(zip_ins_h);
                zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;
                zip_head2(zip_ins_h, zip_strstart);
            };
            var zip_SEND_CODE = function(c, tree) {
                zip_send_bits(tree[c].fc, tree[c].dl);
            };
            var zip_D_CODE = function(dist) {
                return (dist < 256 ? zip_dist_code[dist] : zip_dist_code[256 + (dist >> 7)]) & 255;
            };
            var zip_SMALLER = function(tree, n, m) {
                return tree[n].fc < tree[m].fc || tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m];
            };
            var zip_read_buff = function(buff, offset, n) {
                var i;
                for (i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i++) buff[offset + i] = zip_deflate_data[zip_deflate_pos++] & 255;
                return i;
            };
            var zip_lm_init = function() {
                var j;
                for (j = 0; j < zip_HASH_SIZE; j++) zip_prev[WSIZE + j] = 0;
                zip_max_lazy_match = zip_configuration_table[zip_compr_level].max_lazy;
                zip_good_match = zip_configuration_table[zip_compr_level].good_length;
                if (!zip_FULL_SEARCH) zip_nice_match = zip_configuration_table[zip_compr_level].nice_length;
                zip_max_chain_length = zip_configuration_table[zip_compr_level].max_chain;
                zip_strstart = 0;
                zip_block_start = 0;
                zip_lookahead = zip_read_buff(zip_window, 0, 2 * WSIZE);
                if (zip_lookahead <= 0) {
                    zip_eofile = true;
                    zip_lookahead = 0;
                    return;
                }
                zip_eofile = false;
                while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) zip_fill_window();
                zip_ins_h = 0;
                for (j = 0; j < MIN_MATCH - 1; j++) {
                    zip_ins_h = (zip_ins_h << zip_H_SHIFT ^ zip_window[j] & 255) & zip_HASH_MASK;
                }
            };
            var zip_longest_match = function(cur_match) {
                var chain_length = zip_max_chain_length;
                var scanp = zip_strstart;
                var matchp;
                var len;
                var best_len = zip_prev_length;
                var limit = zip_strstart > zip_MAX_DIST ? zip_strstart - zip_MAX_DIST : zip_NIL;
                var strendp = zip_strstart + MAX_MATCH;
                var scan_end1 = zip_window[scanp + best_len - 1];
                var scan_end = zip_window[scanp + best_len];
                if (zip_prev_length >= zip_good_match) chain_length >>= 2;
                do {
                    matchp = cur_match;
                    if (zip_window[matchp + best_len] != scan_end || zip_window[matchp + best_len - 1] != scan_end1 || zip_window[matchp] != zip_window[scanp] || zip_window[++matchp] != zip_window[scanp + 1]) {
                        continue;
                    }
                    scanp += 2;
                    matchp++;
                    do {} while (zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && zip_window[++scanp] == zip_window[++matchp] && scanp < strendp);
                    len = MAX_MATCH - (strendp - scanp);
                    scanp = strendp - MAX_MATCH;
                    if (len > best_len) {
                        zip_match_start = cur_match;
                        best_len = len;
                        if (zip_FULL_SEARCH) {
                            if (len >= MAX_MATCH) break;
                        } else {
                            if (len >= zip_nice_match) break;
                        }
                        scan_end1 = zip_window[scanp + best_len - 1];
                        scan_end = zip_window[scanp + best_len];
                    }
                } while ((cur_match = zip_prev[cur_match & zip_WMASK]) > limit && --chain_length != 0);
                return best_len;
            };
            var zip_fill_window = function() {
                var n, m;
                var more = zip_window_size - zip_lookahead - zip_strstart;
                if (more == -1) {
                    more--;
                } else if (zip_strstart >= WSIZE + zip_MAX_DIST) {
                    for (n = 0; n < WSIZE; n++) zip_window[n] = zip_window[n + WSIZE];
                    zip_match_start -= WSIZE;
                    zip_strstart -= WSIZE;
                    zip_block_start -= WSIZE;
                    for (n = 0; n < zip_HASH_SIZE; n++) {
                        m = zip_head1(n);
                        zip_head2(n, m >= WSIZE ? m - WSIZE : zip_NIL);
                    }
                    for (n = 0; n < WSIZE; n++) {
                        m = zip_prev[n];
                        zip_prev[n] = m >= WSIZE ? m - WSIZE : zip_NIL;
                    }
                    more += WSIZE;
                }
                if (!zip_eofile) {
                    n = zip_read_buff(zip_window, zip_strstart + zip_lookahead, more);
                    if (n <= 0) zip_eofile = true; else zip_lookahead += n;
                }
            };
            var zip_deflate_fast = function() {
                while (zip_lookahead != 0 && zip_qhead == null) {
                    var flush;
                    zip_INSERT_STRING();
                    if (zip_hash_head != zip_NIL && zip_strstart - zip_hash_head <= zip_MAX_DIST) {
                        zip_match_length = zip_longest_match(zip_hash_head);
                        if (zip_match_length > zip_lookahead) zip_match_length = zip_lookahead;
                    }
                    if (zip_match_length >= MIN_MATCH) {
                        flush = zip_ct_tally(zip_strstart - zip_match_start, zip_match_length - MIN_MATCH);
                        zip_lookahead -= zip_match_length;
                        if (zip_match_length <= zip_max_lazy_match) {
                            zip_match_length--;
                            do {
                                zip_strstart++;
                                zip_INSERT_STRING();
                            } while (--zip_match_length != 0);
                            zip_strstart++;
                        } else {
                            zip_strstart += zip_match_length;
                            zip_match_length = 0;
                            zip_ins_h = zip_window[zip_strstart] & 255;
                            zip_ins_h = (zip_ins_h << zip_H_SHIFT ^ zip_window[zip_strstart + 1] & 255) & zip_HASH_MASK;
                        }
                    } else {
                        flush = zip_ct_tally(0, zip_window[zip_strstart] & 255);
                        zip_lookahead--;
                        zip_strstart++;
                    }
                    if (flush) {
                        zip_flush_block(0);
                        zip_block_start = zip_strstart;
                    }
                    while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) zip_fill_window();
                }
            };
            var zip_deflate_better = function() {
                while (zip_lookahead != 0 && zip_qhead == null) {
                    zip_INSERT_STRING();
                    zip_prev_length = zip_match_length;
                    zip_prev_match = zip_match_start;
                    zip_match_length = MIN_MATCH - 1;
                    if (zip_hash_head != zip_NIL && zip_prev_length < zip_max_lazy_match && zip_strstart - zip_hash_head <= zip_MAX_DIST) {
                        zip_match_length = zip_longest_match(zip_hash_head);
                        if (zip_match_length > zip_lookahead) zip_match_length = zip_lookahead;
                        if (zip_match_length == MIN_MATCH && zip_strstart - zip_match_start > zip_TOO_FAR) {
                            zip_match_length--;
                        }
                    }
                    if (zip_prev_length >= MIN_MATCH && zip_match_length <= zip_prev_length) {
                        var flush;
                        flush = zip_ct_tally(zip_strstart - 1 - zip_prev_match, zip_prev_length - MIN_MATCH);
                        zip_lookahead -= zip_prev_length - 1;
                        zip_prev_length -= 2;
                        do {
                            zip_strstart++;
                            zip_INSERT_STRING();
                        } while (--zip_prev_length != 0);
                        zip_match_available = 0;
                        zip_match_length = MIN_MATCH - 1;
                        zip_strstart++;
                        if (flush) {
                            zip_flush_block(0);
                            zip_block_start = zip_strstart;
                        }
                    } else if (zip_match_available != 0) {
                        if (zip_ct_tally(0, zip_window[zip_strstart - 1] & 255)) {
                            zip_flush_block(0);
                            zip_block_start = zip_strstart;
                        }
                        zip_strstart++;
                        zip_lookahead--;
                    } else {
                        zip_match_available = 1;
                        zip_strstart++;
                        zip_lookahead--;
                    }
                    while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile) zip_fill_window();
                }
            };
            var zip_init_deflate = function() {
                if (zip_eofile) return;
                zip_bi_buf = 0;
                zip_bi_valid = 0;
                zip_ct_init();
                zip_lm_init();
                zip_qhead = null;
                zip_outcnt = 0;
                zip_outoff = 0;
                zip_match_available = 0;
                if (zip_compr_level <= 3) {
                    zip_prev_length = MIN_MATCH - 1;
                    zip_match_length = 0;
                } else {
                    zip_match_length = MIN_MATCH - 1;
                    zip_match_available = 0;
                    zip_match_available = 0;
                }
                zip_complete = false;
            };
            var zip_deflate_internal = function(buff, off, buff_size) {
                var n;
                if (!zip_initflag) {
                    zip_init_deflate();
                    zip_initflag = true;
                    if (zip_lookahead == 0) {
                        zip_complete = true;
                        return 0;
                    }
                }
                if ((n = zip_qcopy(buff, off, buff_size)) == buff_size) return buff_size;
                if (zip_complete) return n;
                if (zip_compr_level <= 3) zip_deflate_fast(); else zip_deflate_better();
                if (zip_lookahead == 0) {
                    if (zip_match_available != 0) zip_ct_tally(0, zip_window[zip_strstart - 1] & 255);
                    zip_flush_block(1);
                    zip_complete = true;
                }
                return n + zip_qcopy(buff, n + off, buff_size - n);
            };
            var zip_qcopy = function(buff, off, buff_size) {
                var n, i, j;
                n = 0;
                while (zip_qhead != null && n < buff_size) {
                    i = buff_size - n;
                    if (i > zip_qhead.len) i = zip_qhead.len;
                    for (j = 0; j < i; j++) buff[off + n + j] = zip_qhead.ptr[zip_qhead.off + j];
                    zip_qhead.off += i;
                    zip_qhead.len -= i;
                    n += i;
                    if (zip_qhead.len == 0) {
                        var p;
                        p = zip_qhead;
                        zip_qhead = zip_qhead.next;
                        zip_reuse_queue(p);
                    }
                }
                if (n == buff_size) return n;
                if (zip_outoff < zip_outcnt) {
                    i = buff_size - n;
                    if (i > zip_outcnt - zip_outoff) i = zip_outcnt - zip_outoff;
                    for (j = 0; j < i; j++) buff[off + n + j] = zip_outbuf[zip_outoff + j];
                    zip_outoff += i;
                    n += i;
                    if (zip_outcnt == zip_outoff) zip_outcnt = zip_outoff = 0;
                }
                return n;
            };
            var zip_ct_init = function() {
                var n;
                var bits;
                var length;
                var code;
                var dist;
                if (zip_static_dtree[0].dl != 0) return;
                zip_l_desc.dyn_tree = zip_dyn_ltree;
                zip_l_desc.static_tree = zip_static_ltree;
                zip_l_desc.extra_bits = zip_extra_lbits;
                zip_l_desc.extra_base = zip_LITERALS + 1;
                zip_l_desc.elems = zip_L_CODES;
                zip_l_desc.max_length = zip_MAX_BITS;
                zip_l_desc.max_code = 0;
                zip_d_desc.dyn_tree = zip_dyn_dtree;
                zip_d_desc.static_tree = zip_static_dtree;
                zip_d_desc.extra_bits = zip_extra_dbits;
                zip_d_desc.extra_base = 0;
                zip_d_desc.elems = zip_D_CODES;
                zip_d_desc.max_length = zip_MAX_BITS;
                zip_d_desc.max_code = 0;
                zip_bl_desc.dyn_tree = zip_bl_tree;
                zip_bl_desc.static_tree = null;
                zip_bl_desc.extra_bits = zip_extra_blbits;
                zip_bl_desc.extra_base = 0;
                zip_bl_desc.elems = zip_BL_CODES;
                zip_bl_desc.max_length = zip_MAX_BL_BITS;
                zip_bl_desc.max_code = 0;
                length = 0;
                for (code = 0; code < zip_LENGTH_CODES - 1; code++) {
                    zip_base_length[code] = length;
                    for (n = 0; n < 1 << zip_extra_lbits[code]; n++) zip_length_code[length++] = code;
                }
                zip_length_code[length - 1] = code;
                dist = 0;
                for (code = 0; code < 16; code++) {
                    zip_base_dist[code] = dist;
                    for (n = 0; n < 1 << zip_extra_dbits[code]; n++) {
                        zip_dist_code[dist++] = code;
                    }
                }
                dist >>= 7;
                for (; code < zip_D_CODES; code++) {
                    zip_base_dist[code] = dist << 7;
                    for (n = 0; n < 1 << zip_extra_dbits[code] - 7; n++) zip_dist_code[256 + dist++] = code;
                }
                for (bits = 0; bits <= zip_MAX_BITS; bits++) zip_bl_count[bits] = 0;
                n = 0;
                while (n <= 143) {
                    zip_static_ltree[n++].dl = 8;
                    zip_bl_count[8]++;
                }
                while (n <= 255) {
                    zip_static_ltree[n++].dl = 9;
                    zip_bl_count[9]++;
                }
                while (n <= 279) {
                    zip_static_ltree[n++].dl = 7;
                    zip_bl_count[7]++;
                }
                while (n <= 287) {
                    zip_static_ltree[n++].dl = 8;
                    zip_bl_count[8]++;
                }
                zip_gen_codes(zip_static_ltree, zip_L_CODES + 1);
                for (n = 0; n < zip_D_CODES; n++) {
                    zip_static_dtree[n].dl = 5;
                    zip_static_dtree[n].fc = zip_bi_reverse(n, 5);
                }
                zip_init_block();
            };
            var zip_init_block = function() {
                var n;
                for (n = 0; n < zip_L_CODES; n++) zip_dyn_ltree[n].fc = 0;
                for (n = 0; n < zip_D_CODES; n++) zip_dyn_dtree[n].fc = 0;
                for (n = 0; n < zip_BL_CODES; n++) zip_bl_tree[n].fc = 0;
                zip_dyn_ltree[zip_END_BLOCK].fc = 1;
                zip_opt_len = zip_static_len = 0;
                zip_last_lit = zip_last_dist = zip_last_flags = 0;
                zip_flags = 0;
                zip_flag_bit = 1;
            };
            var zip_pqdownheap = function(tree, k) {
                var v = zip_heap[k];
                var j = k << 1;
                while (j <= zip_heap_len) {
                    if (j < zip_heap_len && zip_SMALLER(tree, zip_heap[j + 1], zip_heap[j])) j++;
                    if (zip_SMALLER(tree, v, zip_heap[j])) break;
                    zip_heap[k] = zip_heap[j];
                    k = j;
                    j <<= 1;
                }
                zip_heap[k] = v;
            };
            var zip_gen_bitlen = function(desc) {
                var tree = desc.dyn_tree;
                var extra = desc.extra_bits;
                var base = desc.extra_base;
                var max_code = desc.max_code;
                var max_length = desc.max_length;
                var stree = desc.static_tree;
                var h;
                var n, m;
                var bits;
                var xbits;
                var f;
                var overflow = 0;
                for (bits = 0; bits <= zip_MAX_BITS; bits++) zip_bl_count[bits] = 0;
                tree[zip_heap[zip_heap_max]].dl = 0;
                for (h = zip_heap_max + 1; h < zip_HEAP_SIZE; h++) {
                    n = zip_heap[h];
                    bits = tree[tree[n].dl].dl + 1;
                    if (bits > max_length) {
                        bits = max_length;
                        overflow++;
                    }
                    tree[n].dl = bits;
                    if (n > max_code) continue;
                    zip_bl_count[bits]++;
                    xbits = 0;
                    if (n >= base) xbits = extra[n - base];
                    f = tree[n].fc;
                    zip_opt_len += f * (bits + xbits);
                    if (stree != null) zip_static_len += f * (stree[n].dl + xbits);
                }
                if (overflow == 0) return;
                do {
                    bits = max_length - 1;
                    while (zip_bl_count[bits] == 0) bits--;
                    zip_bl_count[bits]--;
                    zip_bl_count[bits + 1] += 2;
                    zip_bl_count[max_length]--;
                    overflow -= 2;
                } while (overflow > 0);
                for (bits = max_length; bits != 0; bits--) {
                    n = zip_bl_count[bits];
                    while (n != 0) {
                        m = zip_heap[--h];
                        if (m > max_code) continue;
                        if (tree[m].dl != bits) {
                            zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
                            tree[m].fc = bits;
                        }
                        n--;
                    }
                }
            };
            var zip_gen_codes = function(tree, max_code) {
                var next_code = new Array(zip_MAX_BITS + 1);
                var code = 0;
                var bits;
                var n;
                for (bits = 1; bits <= zip_MAX_BITS; bits++) {
                    code = code + zip_bl_count[bits - 1] << 1;
                    next_code[bits] = code;
                }
                for (n = 0; n <= max_code; n++) {
                    var len = tree[n].dl;
                    if (len == 0) continue;
                    tree[n].fc = zip_bi_reverse(next_code[len]++, len);
                }
            };
            var zip_build_tree = function(desc) {
                var tree = desc.dyn_tree;
                var stree = desc.static_tree;
                var elems = desc.elems;
                var n, m;
                var max_code = -1;
                var node = elems;
                zip_heap_len = 0;
                zip_heap_max = zip_HEAP_SIZE;
                for (n = 0; n < elems; n++) {
                    if (tree[n].fc != 0) {
                        zip_heap[++zip_heap_len] = max_code = n;
                        zip_depth[n] = 0;
                    } else tree[n].dl = 0;
                }
                while (zip_heap_len < 2) {
                    var xnew = zip_heap[++zip_heap_len] = max_code < 2 ? ++max_code : 0;
                    tree[xnew].fc = 1;
                    zip_depth[xnew] = 0;
                    zip_opt_len--;
                    if (stree != null) zip_static_len -= stree[xnew].dl;
                }
                desc.max_code = max_code;
                for (n = zip_heap_len >> 1; n >= 1; n--) zip_pqdownheap(tree, n);
                do {
                    n = zip_heap[zip_SMALLEST];
                    zip_heap[zip_SMALLEST] = zip_heap[zip_heap_len--];
                    zip_pqdownheap(tree, zip_SMALLEST);
                    m = zip_heap[zip_SMALLEST];
                    zip_heap[--zip_heap_max] = n;
                    zip_heap[--zip_heap_max] = m;
                    tree[node].fc = tree[n].fc + tree[m].fc;
                    if (zip_depth[n] > zip_depth[m] + 1) zip_depth[node] = zip_depth[n]; else zip_depth[node] = zip_depth[m] + 1;
                    tree[n].dl = tree[m].dl = node;
                    zip_heap[zip_SMALLEST] = node++;
                    zip_pqdownheap(tree, zip_SMALLEST);
                } while (zip_heap_len >= 2);
                zip_heap[--zip_heap_max] = zip_heap[zip_SMALLEST];
                zip_gen_bitlen(desc);
                zip_gen_codes(tree, max_code);
            };
            var zip_scan_tree = function(tree, max_code) {
                var n;
                var prevlen = -1;
                var curlen;
                var nextlen = tree[0].dl;
                var count = 0;
                var max_count = 7;
                var min_count = 4;
                if (nextlen == 0) {
                    max_count = 138;
                    min_count = 3;
                }
                tree[max_code + 1].dl = 65535;
                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[n + 1].dl;
                    if (++count < max_count && curlen == nextlen) continue; else if (count < min_count) zip_bl_tree[curlen].fc += count; else if (curlen != 0) {
                        if (curlen != prevlen) zip_bl_tree[curlen].fc++;
                        zip_bl_tree[zip_REP_3_6].fc++;
                    } else if (count <= 10) zip_bl_tree[zip_REPZ_3_10].fc++; else zip_bl_tree[zip_REPZ_11_138].fc++;
                    count = 0;
                    prevlen = curlen;
                    if (nextlen == 0) {
                        max_count = 138;
                        min_count = 3;
                    } else if (curlen == nextlen) {
                        max_count = 6;
                        min_count = 3;
                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            };
            var zip_send_tree = function(tree, max_code) {
                var n;
                var prevlen = -1;
                var curlen;
                var nextlen = tree[0].dl;
                var count = 0;
                var max_count = 7;
                var min_count = 4;
                if (nextlen == 0) {
                    max_count = 138;
                    min_count = 3;
                }
                for (n = 0; n <= max_code; n++) {
                    curlen = nextlen;
                    nextlen = tree[n + 1].dl;
                    if (++count < max_count && curlen == nextlen) {
                        continue;
                    } else if (count < min_count) {
                        do {
                            zip_SEND_CODE(curlen, zip_bl_tree);
                        } while (--count != 0);
                    } else if (curlen != 0) {
                        if (curlen != prevlen) {
                            zip_SEND_CODE(curlen, zip_bl_tree);
                            count--;
                        }
                        zip_SEND_CODE(zip_REP_3_6, zip_bl_tree);
                        zip_send_bits(count - 3, 2);
                    } else if (count <= 10) {
                        zip_SEND_CODE(zip_REPZ_3_10, zip_bl_tree);
                        zip_send_bits(count - 3, 3);
                    } else {
                        zip_SEND_CODE(zip_REPZ_11_138, zip_bl_tree);
                        zip_send_bits(count - 11, 7);
                    }
                    count = 0;
                    prevlen = curlen;
                    if (nextlen == 0) {
                        max_count = 138;
                        min_count = 3;
                    } else if (curlen == nextlen) {
                        max_count = 6;
                        min_count = 3;
                    } else {
                        max_count = 7;
                        min_count = 4;
                    }
                }
            };
            var zip_build_bl_tree = function() {
                var max_blindex;
                zip_scan_tree(zip_dyn_ltree, zip_l_desc.max_code);
                zip_scan_tree(zip_dyn_dtree, zip_d_desc.max_code);
                zip_build_tree(zip_bl_desc);
                for (max_blindex = zip_BL_CODES - 1; max_blindex >= 3; max_blindex--) {
                    if (zip_bl_tree[zip_bl_order[max_blindex]].dl != 0) break;
                }
                zip_opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
                return max_blindex;
            };
            var zip_send_all_trees = function(lcodes, dcodes, blcodes) {
                var rank;
                zip_send_bits(lcodes - 257, 5);
                zip_send_bits(dcodes - 1, 5);
                zip_send_bits(blcodes - 4, 4);
                for (rank = 0; rank < blcodes; rank++) {
                    zip_send_bits(zip_bl_tree[zip_bl_order[rank]].dl, 3);
                }
                zip_send_tree(zip_dyn_ltree, lcodes - 1);
                zip_send_tree(zip_dyn_dtree, dcodes - 1);
            };
            var zip_flush_block = function(eof) {
                var opt_lenb, static_lenb;
                var max_blindex;
                var stored_len;
                stored_len = zip_strstart - zip_block_start;
                zip_flag_buf[zip_last_flags] = zip_flags;
                zip_build_tree(zip_l_desc);
                zip_build_tree(zip_d_desc);
                max_blindex = zip_build_bl_tree();
                opt_lenb = zip_opt_len + 3 + 7 >> 3;
                static_lenb = zip_static_len + 3 + 7 >> 3;
                if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
                if (stored_len + 4 <= opt_lenb && zip_block_start >= 0) {
                    var i;
                    zip_send_bits((zip_STORED_BLOCK << 1) + eof, 3);
                    zip_bi_windup();
                    zip_put_short(stored_len);
                    zip_put_short(~stored_len);
                    for (i = 0; i < stored_len; i++) zip_put_byte(zip_window[zip_block_start + i]);
                } else if (static_lenb == opt_lenb) {
                    zip_send_bits((zip_STATIC_TREES << 1) + eof, 3);
                    zip_compress_block(zip_static_ltree, zip_static_dtree);
                } else {
                    zip_send_bits((zip_DYN_TREES << 1) + eof, 3);
                    zip_send_all_trees(zip_l_desc.max_code + 1, zip_d_desc.max_code + 1, max_blindex + 1);
                    zip_compress_block(zip_dyn_ltree, zip_dyn_dtree);
                }
                zip_init_block();
                if (eof != 0) zip_bi_windup();
            };
            var zip_ct_tally = function(dist, lc) {
                zip_l_buf[zip_last_lit++] = lc;
                if (dist == 0) {
                    zip_dyn_ltree[lc].fc++;
                } else {
                    dist--;
                    zip_dyn_ltree[zip_length_code[lc] + zip_LITERALS + 1].fc++;
                    zip_dyn_dtree[zip_D_CODE(dist)].fc++;
                    zip_d_buf[zip_last_dist++] = dist;
                    zip_flags |= zip_flag_bit;
                }
                zip_flag_bit <<= 1;
                if ((zip_last_lit & 7) == 0) {
                    zip_flag_buf[zip_last_flags++] = zip_flags;
                    zip_flags = 0;
                    zip_flag_bit = 1;
                }
                if (zip_compr_level > 2 && (zip_last_lit & 4095) == 0) {
                    var out_length = zip_last_lit * 8;
                    var in_length = zip_strstart - zip_block_start;
                    var dcode;
                    for (dcode = 0; dcode < zip_D_CODES; dcode++) {
                        out_length += zip_dyn_dtree[dcode].fc * (5 + zip_extra_dbits[dcode]);
                    }
                    out_length >>= 3;
                    if (zip_last_dist < parseInt(zip_last_lit / 2) && out_length < parseInt(in_length / 2)) return true;
                }
                return zip_last_lit == LIT_BUFSIZE - 1 || zip_last_dist == zip_DIST_BUFSIZE;
            };
            var zip_compress_block = function(ltree, dtree) {
                var dist;
                var lc;
                var lx = 0;
                var dx = 0;
                var fx = 0;
                var flag = 0;
                var code;
                var extra;
                if (zip_last_lit != 0) do {
                    if ((lx & 7) == 0) flag = zip_flag_buf[fx++];
                    lc = zip_l_buf[lx++] & 255;
                    if ((flag & 1) == 0) {
                        zip_SEND_CODE(lc, ltree);
                    } else {
                        code = zip_length_code[lc];
                        zip_SEND_CODE(code + zip_LITERALS + 1, ltree);
                        extra = zip_extra_lbits[code];
                        if (extra != 0) {
                            lc -= zip_base_length[code];
                            zip_send_bits(lc, extra);
                        }
                        dist = zip_d_buf[dx++];
                        code = zip_D_CODE(dist);
                        zip_SEND_CODE(code, dtree);
                        extra = zip_extra_dbits[code];
                        if (extra != 0) {
                            dist -= zip_base_dist[code];
                            zip_send_bits(dist, extra);
                        }
                    }
                    flag >>= 1;
                } while (lx < zip_last_lit);
                zip_SEND_CODE(zip_END_BLOCK, ltree);
            };
            var zip_Buf_size = 16;
            var zip_send_bits = function(value, length) {
                if (zip_bi_valid > zip_Buf_size - length) {
                    zip_bi_buf |= value << zip_bi_valid;
                    zip_put_short(zip_bi_buf);
                    zip_bi_buf = value >> zip_Buf_size - zip_bi_valid;
                    zip_bi_valid += length - zip_Buf_size;
                } else {
                    zip_bi_buf |= value << zip_bi_valid;
                    zip_bi_valid += length;
                }
            };
            var zip_bi_reverse = function(code, len) {
                var res = 0;
                do {
                    res |= code & 1;
                    code >>= 1;
                    res <<= 1;
                } while (--len > 0);
                return res >> 1;
            };
            var zip_bi_windup = function() {
                if (zip_bi_valid > 8) {
                    zip_put_short(zip_bi_buf);
                } else if (zip_bi_valid > 0) {
                    zip_put_byte(zip_bi_buf);
                }
                zip_bi_buf = 0;
                zip_bi_valid = 0;
            };
            var zip_qoutbuf = function() {
                if (zip_outcnt != 0) {
                    var q, i;
                    q = zip_new_queue();
                    if (zip_qhead == null) zip_qhead = zip_qtail = q; else zip_qtail = zip_qtail.next = q;
                    q.len = zip_outcnt - zip_outoff;
                    for (i = 0; i < q.len; i++) q.ptr[i] = zip_outbuf[zip_outoff + i];
                    zip_outcnt = zip_outoff = 0;
                }
            };
            function deflate(buffData, level) {
                zip_deflate_data = buffData;
                zip_deflate_pos = 0;
                zip_deflate_start(level);
                var buff = new Array(1024), pages = [], totalSize = 0, i;
                for (i = 0; i < 1024; i++) buff[i] = 0;
                while ((i = zip_deflate_internal(buff, 0, buff.length)) > 0) {
                    var buf = new Buffer(buff.slice(0, i));
                    pages.push(buf);
                    totalSize += buf.length;
                }
                if (pages.length == 1) {
                    return pages[0];
                }
                var result = new Buffer(totalSize), index = 0;
                for (i = 0; i < pages.length; i++) {
                    pages[i].copy(result, index);
                    index = index + pages[i].length;
                }
                return result;
            }
            return {
                deflate: function() {
                    return deflate(inbuf, 8);
                }
            };
        }
        module.exports = function(inbuf) {
            var zlib = require("fs");
            return {
                deflate: function() {
                    return (new JSDeflater(inbuf)).deflate();
                },
                deflateAsync: function(callback) {
                    var tmp = zlib.createDeflateRaw({
                        chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024
                    }), parts = [], total = 0;
                    tmp.on("data", function(data) {
                        parts.push(data);
                        total += data.length;
                    });
                    tmp.on("end", function() {
                        var buf = new Buffer(total), written = 0;
                        buf.fill(0);
                        for (var i = 0; i < parts.length; i++) {
                            var part = parts[i];
                            part.copy(buf, written);
                            written += part.length;
                        }
                        callback && callback(buf);
                    });
                    tmp.end(inbuf);
                }
            };
        };
        return module.exports;
    });
    define("adm-zip/methods/inflater.js", function(require, module, exports, __dirname, __filename) {
        var Buffer = require("buffer").Buffer;
        function JSInflater(input) {
            var WSIZE = 32768, slide = new Buffer(65536), windowPos = 0, fixedTableList = null, fixedTableDist, fixedLookup, bitBuf = 0, bitLen = 0, method = -1, eof = false, copyLen = 0, copyDist = 0, tblList, tblDist, bitList, bitdist, inputPosition = 0, MASK_BITS = [ 0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535 ], LENS = [ 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0 ], LEXT = [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99 ], DISTS = [ 1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 ], DEXT = [ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 ], BITORDER = [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];
            function HuffTable(clen, cnum, cval, blist, elist, lookupm) {
                this.status = 0;
                this.root = null;
                this.maxbit = 0;
                var el, f, tail, offsets = [], countTbl = [], sTbl = [], values = [], tentry = {
                    extra: 0,
                    bitcnt: 0,
                    lbase: 0,
                    next: null
                };
                tail = this.root = null;
                for (var i = 0; i < 17; i++) {
                    countTbl[i] = 0;
                    sTbl[i] = 0;
                    offsets[i] = 0;
                }
                for (i = 0; i < 288; i++) values[i] = 0;
                el = cnum > 256 ? clen[256] : 16;
                var pidx = -1;
                while (++pidx < cnum) countTbl[clen[pidx]]++;
                if (countTbl[0] == cnum) return;
                for (var j = 1; j <= 16; j++) if (countTbl[j] != 0) break;
                var bitLen = j;
                for (i = 16; i != 0; i--) if (countTbl[i] != 0) break;
                var maxLen = i;
                lookupm < j && (lookupm = j);
                var dCodes = 1 << j;
                for (; j < i; j++, dCodes <<= 1) if ((dCodes -= countTbl[j]) < 0) {
                    this.status = 2;
                    this.maxbit = lookupm;
                    return;
                }
                if ((dCodes -= countTbl[i]) < 0) {
                    this.status = 2;
                    this.maxbit = lookupm;
                    return;
                }
                countTbl[i] += dCodes;
                offsets[1] = j = 0;
                pidx = 1;
                var xp = 2;
                while (--i > 0) offsets[xp++] = j += countTbl[pidx++];
                pidx = 0;
                i = 0;
                do {
                    (j = clen[pidx++]) && (values[offsets[j]++] = i);
                } while (++i < cnum);
                cnum = offsets[maxLen];
                offsets[0] = i = 0;
                pidx = 0;
                var level = -1, w = sTbl[0] = 0, cnode = null, tblCnt = 0, tblStack = [];
                for (; bitLen <= maxLen; bitLen++) {
                    var kccnt = countTbl[bitLen];
                    while (kccnt-- > 0) {
                        while (bitLen > w + sTbl[1 + level]) {
                            w += sTbl[1 + level];
                            level++;
                            tblCnt = (tblCnt = maxLen - w) > lookupm ? lookupm : tblCnt;
                            if ((f = 1 << (j = bitLen - w)) > kccnt + 1) {
                                f -= kccnt + 1;
                                xp = bitLen;
                                while (++j < tblCnt) {
                                    if ((f <<= 1) <= countTbl[++xp]) break;
                                    f -= countTbl[xp];
                                }
                            }
                            if (w + j > el && w < el) j = el - w;
                            tblCnt = 1 << j;
                            sTbl[1 + level] = j;
                            cnode = [];
                            while (cnode.length < tblCnt) cnode.push({
                                extra: 0,
                                bitcnt: 0,
                                lbase: 0,
                                next: null
                            });
                            if (tail == null) {
                                tail = this.root = {
                                    next: null,
                                    list: null
                                };
                            } else {
                                tail = tail.next = {
                                    next: null,
                                    list: null
                                };
                            }
                            tail.next = null;
                            tail.list = cnode;
                            tblStack[level] = cnode;
                            if (level > 0) {
                                offsets[level] = i;
                                tentry.bitcnt = sTbl[level];
                                tentry.extra = 16 + j;
                                tentry.next = cnode;
                                j = (i & (1 << w) - 1) >> w - sTbl[level];
                                tblStack[level - 1][j].extra = tentry.extra;
                                tblStack[level - 1][j].bitcnt = tentry.bitcnt;
                                tblStack[level - 1][j].lbase = tentry.lbase;
                                tblStack[level - 1][j].next = tentry.next;
                            }
                        }
                        tentry.bitcnt = bitLen - w;
                        if (pidx >= cnum) tentry.extra = 99; else if (values[pidx] < cval) {
                            tentry.extra = values[pidx] < 256 ? 16 : 15;
                            tentry.lbase = values[pidx++];
                        } else {
                            tentry.extra = elist[values[pidx] - cval];
                            tentry.lbase = blist[values[pidx++] - cval];
                        }
                        f = 1 << bitLen - w;
                        for (j = i >> w; j < tblCnt; j += f) {
                            cnode[j].extra = tentry.extra;
                            cnode[j].bitcnt = tentry.bitcnt;
                            cnode[j].lbase = tentry.lbase;
                            cnode[j].next = tentry.next;
                        }
                        for (j = 1 << bitLen - 1; (i & j) != 0; j >>= 1) i ^= j;
                        i ^= j;
                        while ((i & (1 << w) - 1) != offsets[level]) {
                            w -= sTbl[level];
                            level--;
                        }
                    }
                }
                this.maxbit = sTbl[1];
                this.status = dCodes != 0 && maxLen != 1 ? 1 : 0;
            }
            function addBits(n) {
                while (bitLen < n) {
                    bitBuf |= input[inputPosition++] << bitLen;
                    bitLen += 8;
                }
                return bitBuf;
            }
            function cutBits(n) {
                bitLen -= n;
                return bitBuf >>= n;
            }
            function maskBits(n) {
                while (bitLen < n) {
                    bitBuf |= input[inputPosition++] << bitLen;
                    bitLen += 8;
                }
                var res = bitBuf & MASK_BITS[n];
                bitBuf >>= n;
                bitLen -= n;
                return res;
            }
            function codes(buff, off, size) {
                var e, t;
                if (size == 0) return 0;
                var n = 0;
                for (;;) {
                    t = tblList.list[addBits(bitList) & MASK_BITS[bitList]];
                    e = t.extra;
                    while (e > 16) {
                        if (e == 99) return -1;
                        cutBits(t.bitcnt);
                        e -= 16;
                        t = t.next[addBits(e) & MASK_BITS[e]];
                        e = t.extra;
                    }
                    cutBits(t.bitcnt);
                    if (e == 16) {
                        windowPos &= WSIZE - 1;
                        buff[off + n++] = slide[windowPos++] = t.lbase;
                        if (n == size) return size;
                        continue;
                    }
                    if (e == 15) break;
                    copyLen = t.lbase + maskBits(e);
                    t = tblDist.list[addBits(bitdist) & MASK_BITS[bitdist]];
                    e = t.extra;
                    while (e > 16) {
                        if (e == 99) return -1;
                        cutBits(t.bitcnt);
                        e -= 16;
                        t = t.next[addBits(e) & MASK_BITS[e]];
                        e = t.extra;
                    }
                    cutBits(t.bitcnt);
                    copyDist = windowPos - t.lbase - maskBits(e);
                    while (copyLen > 0 && n < size) {
                        copyLen--;
                        copyDist &= WSIZE - 1;
                        windowPos &= WSIZE - 1;
                        buff[off + n++] = slide[windowPos++] = slide[copyDist++];
                    }
                    if (n == size) return size;
                }
                method = -1;
                return n;
            }
            function stored(buff, off, size) {
                cutBits(bitLen & 7);
                var n = maskBits(16);
                if (n != (~maskBits(16) & 65535)) return -1;
                copyLen = n;
                n = 0;
                while (copyLen > 0 && n < size) {
                    copyLen--;
                    windowPos &= WSIZE - 1;
                    buff[off + n++] = slide[windowPos++] = maskBits(8);
                }
                if (copyLen == 0) method = -1;
                return n;
            }
            function fixed(buff, off, size) {
                var fixed_bd = 0;
                if (fixedTableList == null) {
                    var lengths = [];
                    for (var symbol = 0; symbol < 144; symbol++) lengths[symbol] = 8;
                    for (; symbol < 256; symbol++) lengths[symbol] = 9;
                    for (; symbol < 280; symbol++) lengths[symbol] = 7;
                    for (; symbol < 288; symbol++) lengths[symbol] = 8;
                    fixedLookup = 7;
                    var htbl = new HuffTable(lengths, 288, 257, LENS, LEXT, fixedLookup);
                    if (htbl.status != 0) return -1;
                    fixedTableList = htbl.root;
                    fixedLookup = htbl.maxbit;
                    for (symbol = 0; symbol < 30; symbol++) lengths[symbol] = 5;
                    fixed_bd = 5;
                    htbl = new HuffTable(lengths, 30, 0, DISTS, DEXT, fixed_bd);
                    if (htbl.status > 1) {
                        fixedTableList = null;
                        return -1;
                    }
                    fixedTableDist = htbl.root;
                    fixed_bd = htbl.maxbit;
                }
                tblList = fixedTableList;
                tblDist = fixedTableDist;
                bitList = fixedLookup;
                bitdist = fixed_bd;
                return codes(buff, off, size);
            }
            function dynamic(buff, off, size) {
                var ll = new Array(572);
                for (var m = 0; m < 572; m++) ll[m] = 0;
                var llencnt = 257 + maskBits(5), dcodescnt = 1 + maskBits(5), bitlencnt = 4 + maskBits(4);
                if (llencnt > 286 || dcodescnt > 30) return -1;
                for (var j = 0; j < bitlencnt; j++) ll[BITORDER[j]] = maskBits(3);
                for (; j < 19; j++) ll[BITORDER[j]] = 0;
                bitList = 7;
                var hufTable = new HuffTable(ll, 19, 19, null, null, bitList);
                if (hufTable.status != 0) return -1;
                tblList = hufTable.root;
                bitList = hufTable.maxbit;
                var lencnt = llencnt + dcodescnt, i = 0, lastLen = 0;
                while (i < lencnt) {
                    var hufLcode = tblList.list[addBits(bitList) & MASK_BITS[bitList]];
                    j = hufLcode.bitcnt;
                    cutBits(j);
                    j = hufLcode.lbase;
                    if (j < 16) ll[i++] = lastLen = j; else if (j == 16) {
                        j = 3 + maskBits(2);
                        if (i + j > lencnt) return -1;
                        while (j-- > 0) ll[i++] = lastLen;
                    } else if (j == 17) {
                        j = 3 + maskBits(3);
                        if (i + j > lencnt) return -1;
                        while (j-- > 0) ll[i++] = 0;
                        lastLen = 0;
                    } else {
                        j = 11 + maskBits(7);
                        if (i + j > lencnt) return -1;
                        while (j-- > 0) ll[i++] = 0;
                        lastLen = 0;
                    }
                }
                bitList = 9;
                hufTable = new HuffTable(ll, llencnt, 257, LENS, LEXT, bitList);
                bitList == 0 && (hufTable.status = 1);
                if (hufTable.status != 0) return -1;
                tblList = hufTable.root;
                bitList = hufTable.maxbit;
                for (i = 0; i < dcodescnt; i++) ll[i] = ll[i + llencnt];
                bitdist = 6;
                hufTable = new HuffTable(ll, dcodescnt, 0, DISTS, DEXT, bitdist);
                tblDist = hufTable.root;
                bitdist = hufTable.maxbit;
                if (bitdist == 0 && llencnt > 257 || hufTable.status != 0) return -1;
                return codes(buff, off, size);
            }
            return {
                inflate: function(outputBuffer) {
                    tblList = null;
                    var size = outputBuffer.length, offset = 0, i;
                    while (offset < size) {
                        if (eof && method == -1) return;
                        if (copyLen > 0) {
                            if (method != 0) {
                                while (copyLen > 0 && offset < size) {
                                    copyLen--;
                                    copyDist &= WSIZE - 1;
                                    windowPos &= WSIZE - 1;
                                    outputBuffer[offset++] = slide[windowPos++] = slide[copyDist++];
                                }
                            } else {
                                while (copyLen > 0 && offset < size) {
                                    copyLen--;
                                    windowPos &= WSIZE - 1;
                                    outputBuffer[offset++] = slide[windowPos++] = maskBits(8);
                                }
                                copyLen == 0 && (method = -1);
                            }
                            if (offset == size) return;
                        }
                        if (method == -1) {
                            if (eof) break;
                            eof = maskBits(1) != 0;
                            method = maskBits(2);
                            tblList = null;
                            copyLen = 0;
                        }
                        switch (method) {
                          case 0:
                            i = stored(outputBuffer, offset, size - offset);
                            break;
                          case 1:
                            i = tblList != null ? codes(outputBuffer, offset, size - offset) : fixed(outputBuffer, offset, size - offset);
                            break;
                          case 2:
                            i = tblList != null ? codes(outputBuffer, offset, size - offset) : dynamic(outputBuffer, offset, size - offset);
                            break;
                          default:
                            i = -1;
                            break;
                        }
                        if (i == -1) return;
                        offset += i;
                    }
                }
            };
        }
        module.exports = function(inbuf) {
            var zlib = require("zlib");
            return {
                inflateAsync: function(callback) {
                    var tmp = zlib.createInflateRaw(), parts = [], total = 0;
                    tmp.on("data", function(data) {
                        parts.push(data);
                        total += data.length;
                    });
                    tmp.on("end", function() {
                        var buf = new Buffer(total), written = 0;
                        buf.fill(0);
                        for (var i = 0; i < parts.length; i++) {
                            var part = parts[i];
                            part.copy(buf, written);
                            written += part.length;
                        }
                        callback && callback(buf);
                    });
                    tmp.end(inbuf);
                },
                inflate: function(outputBuffer) {
                    var x = {
                        x: new JSInflater(inbuf)
                    };
                    x.x.inflate(outputBuffer);
                    delete x.x;
                }
            };
        };
        return module.exports;
    });
    module.exports = _require("adm-zip/adm-zip.js");
})();
