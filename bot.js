const key = require('./bkapi');
const T = require('./T');
const rp = require('request-promise');
const request = require('request');
const fs = require('fs');

let reqObj = {
    url: 'https://www.brooklynmuseum.org/api/v2/archive/image/',
    headers: {
        'api_key': key
    },
    json: true
}

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};

const download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

const tweet = function(alt){
    T.post('media/upload', { media_data: b64content }, function (err, data, response) {
        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        var altText = "Small flowers in a planter on a sunny balcony, blossoming."
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

        T.post('media/metadata/create', meta_params, function (err, data, response) {
            if (!err) {
                // now we can reference the media and post a tweet (media will attach to the tweet)
                var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }

                T.post('statuses/update', params, function (err, data, response) {
                    console.log(data)
                })
            }
        })
    })
}

rp.get(reqObj)
    .then(resp => {
        let data = resp.data.pick();
        console.log(data)
        let imgurl = 'https://' + data.largest_derivative_url;
        download(imgurl, 'img.jpg', function(){
            console.log('img saved to img.jpg');
        });
    })
