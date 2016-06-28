//var socket = io.connect('http://10.254.17.169:8081/');

$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

$('#upload-input').on('change', function(){
  var files = $(this).get(0).files;

  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }
	
	var x = document.getElementById("upload-input");
	var txt = "";
	if ('files' in x) {
		if (x.files.length == 0) {
			txt = "Select one or more files.";
		} else {
			txt += "<br><strong>" + username + "</strong><br>";
			for (var i = 0; i < x.files.length; i++) {
				var file = x.files[i];
				if ('name' in file) {
					txt += "name: " + file.name + "<br>";
				}
				if ('size' in file) {
					var size = file.size / 1000 / 1000;
					size = Math.round(size * 100) / 100
					txt += "size: " + size + " MB <br>";
				}
			}
			socket.emit('newFile', file); // Sends the file to the others
		}
	}
	else {
		if (x.value == "") {
			txt += "Select one or more files.";
		} else {
			txt += "The files property is not supported by your browser!";
			txt  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead.
		}
	}
	$('alerts').prepend(txt);

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
      },
      xhr: function() {
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {

          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            $('.progress-bar').text(percentComplete + '%');
            $('.progress-bar').width(percentComplete + '%');

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
				$('.progress-bar').html('Done');
				setTimeout(function(){
					$('.progress-bar').text('Ready');
				}, 2000);
				setTimeout(function(){
					$('.progress-bar').text('0%');
					$('.progress-bar').width('0%');
				}, 4000);
            }
          }
        }, false);
        return xhr;
      }
    });
  }
});
