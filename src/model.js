var request = require('request');
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
        var formData = _.clone(data);

        _.each(files, function (name, key) {
            formData['image' + key] = fs.createReadStream(name);
        });

        var url = self.domain + 'makaba/posting.fcgi?json=1'

        request.post({
            url: url,
            formData: formData,
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36'
            }
        }, function (err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            callback(body);
        });
    }
});
