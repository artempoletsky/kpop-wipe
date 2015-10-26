var gui = require('nw.gui');
var fs = require('fs');

var FD = require('form-data');

$.fn.serialize = function () {
    return _.foldl(this.serializeArray(), function (result, object) {
        result[object.name] = object.value;
        return result;
    }, {});
};

ViewModel.create({
    el: 'body',
    autoParseBinds: true,
    wrapReady: true,
    defaults: {
        captcha: undefined,
        loadingState: ''
    },
    shortcuts: {
        $form: '.postform',
        $log: '#log',
        $file: '.file_input'
    },
    events: {
        'click .send': 'send'
    },

    send: function (e) {
        if (e) {
            e.preventDefault();
        }


        //this.postInThread('kpop', '177');

    },
    posted: [],
    watchBoard: function () {
        var self = this;
        var fn = function () {
            self.findWebmThread(function (op, subfolder) {
                var thread = op.num;
                self.postInThread('b', thread, subfolder);
            });
        };

        fn();
        setInterval(fn, 5 * 60 * 1000);
    },
    findWebmThread: function (callback) {
        var self = this;
        this.getThreads('b', function (data) {
            /*
             var ops = _.map(data.threads, function (thread) {
             return thread.posts[0];
             });*/
            //console.log(data);
            var subfolder;
            _.each(data.threads, function (op) {
                //console.log(op);
                subfolder = self.validateThread(op);
                if (subfolder) {
                    self.log('webm thread found ' + op.num + ' / ' + subfolder);
                    console.log(op);
                    callback(op, subfolder);
                    return false;
                }
            });

            if (!subfolder) {
                self.log('can not find webm thread');
            }
        });
    },
    strip: function (html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    },
    webmRegex: /webm|цуиь|шебм|вебм|ШЕВМ|web-m/ig,
    webmRegexExclude: /анимублядский|фап/ig,
    regexSpecial: {
        isis: /игил|isis|ислам/ig
    },
    validateThread: function (op) {
        var subj = op.comment;
        if (this.webmRegex.test(subj)) {

            if (this.webmRegexExclude.test(subj)) {

                return false;
            }

            if (this.posted.indexOf(op.num) != -1) {
                return false;
            }


            subj = this.strip(subj);
            //console.log(subj);
            if (subj.length > 80) {
                console.log(subj);
                return false;
            }


            var self = this;
            var found = false;
            _.each(this.regexSpecial, function (regex, key) {
                if (regex.test(subj)) {
                    found = key;
                    return false;
                }
            });

            if (found) {
                return false;
            }

            return 'default';
        } else {
            //  console.log(subj);
        }
    },
    chooseFile: function (subfolder, callback) {

        var self = this;
        //console.log();
        fs.readdir('./files/' + subfolder, function (err, files) {
            var filename = files[Math.floor(files.length * Math.random())];
            var fullFileName = process.cwd() + '/files/' + subfolder + '/' + filename;
            self.log('File chosen: ' + fullFileName);
            callback(fullFileName);
            //console.log(fullFileName);
            //self.$file[0].value =fullFileName;
            //console.log(filename);
        });
    },
    openLink: function (e) {
        e.preventDefault();
        gui.Shell.openExternal(this.link);
    },
    domain: 'https://2ch.hk/',
    getCaptcha: function (callback) {
        var self = this;
        $.get(self.domain + 'makaba/captcha.fcgi?type=2chaptcha&action=thread', function (data) {
            var id = data.split(/\n/)[1];
            if (id) {
                self.captcha = self.domain + 'makaba/captcha.fcgi?type=2chaptcha&action=image&id=' + id;
            } else {
                self.captcha = undefined;
                callback();
            }
        });
    },
    log: function (text) {
        this.$log.val(this.$log.val() + text + '\n');
    },
    getThreads: function (board, callback) {
        $.get(this.domain + '/' + board + '/catalog.json', callback);
    },
    postInThread: function (board, thread, subfolder) {
        var self = this;
        var fd = new FD();
        fd.append('board', board);
        fd.append('thread', thread);

        _.each(self.$form.serialize(), function (value, key) {
            fd.append(key, value);
        });

        //console.log(fd.get('image1'));
        self.chooseFile(subfolder, function (name) {
            fd.append('image1', fs.createReadStream(name));

            //console.log(fd);
            //return;
            var url = self.domain + 'makaba/posting.fcgi?json=1'

            self.log('Post start: board = ' + board + 'thread = ' + thread);
            fd.submit({
                host: '2ch.hk',
                path: '/makaba/posting.fcgi?json=1',
                headers: {
                    'Accept': '*/*',
                    //'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryaHm5pJod8blkud3H',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36'
                }
            }, function (err, res) {
                var body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    self.posted.push(thread);
                    fs.writeFileSync('./posted.json', JSON.stringify(self.posted));
                    self.log('Post end: ' + body);
                });
            });
        });
        //return;

    },
    initialize: function () {
        var self = this;
        self.getCaptcha(function () {
            self.watchBoard();
        });

        this.posted = JSON.parse(fs.readFileSync('./posted.json', 'utf-8'));

        var tray = new gui.Tray({tooltip: 'K-Pop Bot', icon: './icon.png'});

        var win = this.win = gui.Window.get();

        var menu = new gui.Menu();
        menu.append(new gui.MenuItem({type: 'checkbox', label: 'box1'}));
        tray.menu = menu;


        tray.on('click', function () {
            win.show();
        });
    }
});
