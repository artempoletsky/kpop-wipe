var gui = require('nw.gui');


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


    },
    posted: [],
    watchBoard: function () {
        var self = this;
        var fn = function () {
            self.findWebmThread(function (op, subfolder) {
                var thread = op.num;
                var data = self.$form.serialize();
                data.board = 'b';
                data.thread = thread;
                API.postInThread(data, API.chooseFiles(1, subfolder));
            });
        };

        fn();
        setInterval(fn, 5 * 60 * 1000);
    },
    findWebmThread: function (callback) {
        var self = this;
        API.getThreads('b', function (data) {
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

    openLink: function (e) {
        e.preventDefault();
        gui.Shell.openExternal(this.link);
    },

    getCaptcha: function (callback) {
        var self = this;
        $.get(API.domain + 'makaba/captcha.fcgi?type=2chaptcha&action=thread', function (data) {
            var id = data.split(/\n/)[1];
            if (id) {
                self.captcha = API.domain + 'makaba/captcha.fcgi?type=2chaptcha&action=image&id=' + id;
            } else {
                self.captcha = undefined;
                callback();
            }
        });
    },
    log: function (text) {
        this.$log.val(this.$log.val() + text + '\n');
    },

    initialize: function () {
        var self = this;
        self.getCaptcha(function () {
            //self.watchBoard();
        });

        this.posted = JSON.parse(fs.readFileSync('./posted.json', 'utf-8'));

        var tray = new gui.Tray({tooltip: 'K-Pop Bot', icon: './icon.png'});

        var win = this.win = gui.Window.get();

        /*var menu = new gui.Menu();
         menu.append(new gui.MenuItem({type: 'checkbox', label: 'box1'}));
         tray.menu = menu;*/


        tray.on('click', function () {
            win.show();
        });

        var data = self.$form.serialize();
        data.board = 'kpop';
        data.thread = '14395';
        data.comment = '';
        API.postInThread(data, API.chooseFiles(1, 'default'), function (data) {
            self.log('Post end: ' + data);
            //self.posted.push(thread);
            //fs.writeFileSync('./posted.json', JSON.stringify(self.posted));
        });
    }
});
