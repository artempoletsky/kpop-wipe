var FD = require('form-data');
var fs = require('fs');


var API = Class.create({
    domain: 'https://2ch.hk/',
    getThreads: function (board, callback) {
        $.get(this.domain + '/' + board + '/catalog.json', callback);
    },
    chooseFiles: function (num, subfolder) {
        var files = fs.readdirSync('./files/' + subfolder);
        var names = [];
        var dir = process.cwd() + '/files/' + subfolder + '/';
        var filesTotal = files.length;
        for (var i = 0; i < num; i++) {
            names.push(dir + files[Math.floor(filesTotal * Math.random())]);
        }
        return names;

    },
    postInThread: function (data, files, callback) {
        var self = this;
        var fd = new FD();

        _.each(data, function (value, key) {
            fd.append(key, value);
        });

        _.each(files, function (name, key) {
            fd.append('image' + key, fs.createReadStream(name))
        });


        var url = self.domain + 'makaba/posting.fcgi?json=1'

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

                callback(body);

            });
        });

    },
});
