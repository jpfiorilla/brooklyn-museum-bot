const key = require('./bkapi');
const Twit = require('twit');
const twitCredentials = require('./T');
const T = new Twit(twitCredentials);
const rp = require('request-promise');
const request = require('request');
const fs = require('fs');

let reqObj = {
    url: 'https://www.brooklynmuseum.org/api/v2' + '/archive/image/',
    // url: 'https://www.brooklynmuseum.org/api/v2' + '/object/',
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

const tweet = function(caption){
    const b64content = fs.readFileSync('./img.jpg', { encoding: 'base64' });
    T.post('media/upload', { media_data: b64content }, function (err, data, response) {
        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        var altText = "From the Brooklyn Museum."
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

        T.post('media/metadata/create', meta_params, function (err, data, response) {
            if (!err) {
                // now we can reference the media and post a tweet (media will attach to the tweet)
                var params = { status: caption, media_ids: [mediaIdStr] }

                T.post('statuses/update', params, function (err, data, response) {
                    console.log(data)
                })
            }
        })
    })
}

const getCaption = function(cap){
    let inEm = cap.substring(cap.indexOf('<em>')+5, cap.indexOf('</em>')-1);
    let arr = inEm.split('.');
    for (var i = 0; i < arr.length; i++){
        if (arr[i].includes('Views, Objects')) return inEm.substring(inEm.indexOf(":")+2);
        if (arr[i].includes('Brooklyn') || arr[i].includes('Fulton')) return arr.slice(0, i).join('.');
    }
    return arr.join('.')
}

rp.get(reqObj)
    .then(resp => {
        // console.log(resp.data.length)
        let data = resp.data.pick();
        console.log(data)
        let imgurl = 'https://' + data.largest_derivative_url;
        const caption = getCaption(data.caption);
        console.log(caption);
        download(imgurl, 'img.jpg', function(){
            console.log('img saved to img.jpg');
            tweet(caption);
        });
    })
