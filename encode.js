var fs = require('fs');
var img = process.argv.slice(2)[0];

fs.readFile(img, function(err, original_data){
    var base64Image = original_data.toString('base64');
    var append = 'data:image/gif;base64,';
    console.log(append+base64Image);
});
