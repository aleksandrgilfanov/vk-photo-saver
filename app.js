var VK = require('./vksdk.js');
var http = require('http');
var fs = require('fs');

var program_name = process.argv[0]; //value will be "node"
var script_path = process.argv[1]; //value will be "scriptname.js"
var user_token = process.argv[2];
var album_link = process.argv[3];

if ( (user_token == null) || (album_link == null) ){
	console.log('use: node app.js your_token album_link');
	process.kill(process.pid, 'SIGTERM');
}

var download = function(url, dest, cb) {
	var file = fs.createWriteStream(dest);
	var request = http.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
    		// close() is async, call cb after close completes.
    		file.close(cb);
    	});
	});
}

var vk = new VK({
	'appID'     : 4356368,
	'appSecret' : 'pnPSotOqLJhsUY69uq2c',
	'mode'      : 'oauth'
});

/* http://vk.com/album64702711_184525237 */
var user_id;
var albom_id;
var out_folder;
var result = album_link.match(/album(\d+)_(\d+)/);
if (result != null) {
	user_id = result[1];
	albom_id = result[2];
	out_folder = 'album' + albom_id + '_' + user_id;
}
else {
	console.log('error: album_link is not correct');
	process.kill(process.pid, 'SIGTERM');
}


/* make folder if it is not exist */
if ( !fs.existsSync(out_folder) ) {
     fs.mkdirSync(out_folder, 0766, function(err) {
       if(err) { 
         console.log(err);
       }
     });   
 }

vk.setToken( { token : user_token });

vk.request('photos.get', {'uid' : user_id, 'aid' : albom_id});

var total_photos = 0;

vk.on('done:photos.get', function(_o) {
	total_photos = _o.response.length;
	console.log('total photos in album: ' + total_photos);

	_o.response.forEach(function(item) {
		var linkToPhoto = item.src_xxbig;
		var splittedLink = linkToPhoto.split('/');
		var photoFileName = splittedLink[splittedLink.length-1];

		download(linkToPhoto, out_folder + '/' + photoFileName, function(){
    		/* 'download is finished' callback */
    		total_photos--;
    		console.log('remaining photos: ' + total_photos);
    	});
	});
});
