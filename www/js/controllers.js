function PlayerController($scope, $http, Record) {
    $scope.records = Record.query();

    $scope.selectRecord = function (fileName) {
        $scope.record = _.where($scope.records, {fileName: fileName})[0];
    }

    $scope.newRecord = function () {
        $scope.record = new Record();
    }

    $scope.saveRecord = function () {
        if ($scope.record._id == null) {
            Record.save({}, $scope.record, function (data) {
                $scope.records.push(data);
            });
        }
        else {
            Record.update({recordId: $scope.record._id}, $scope.record, function (data) {
            });
        }
    }

    $scope.completeRecord = function (fileName) {
        Record.delete({fileName: fileName}, function () {
            $scope.records = _.without($scope.records, $scope.record);
        });
    }
}

function RecordController($scope, Data) {
    $scope.data = Data;
    $scope.max = 100;

    var recordPrepare = $scope.recordPrepare = function () {
        $('#prepareRecord').attr("disabled", false);
        $('#record').unbind();
        $('#record').html('Start recording');
        $('#record').bind('touchstart', function (){
            //$( "#dialog-modal" ).dialog( "close" );
            recordAudio($scope, Data);
        });
        /*$( "#dialog-modal" ).dialog({
            autoOpen: false,
            width: 350,
            modal: true
        });
        $( "#prepareRecord" )
            .button()
            .click(function() {
                $( "#dialog-modal" ).dialog( "open" );
            });*/
    };

    function stopRecording() {
        $("#progressbar" ).progressbar( "destroy" );
        $('#message').html('Audio file successfully created:<br />' + src);
        clearInterval(recInterval);
        audioRecording.stopRecord();
        recordPrepare();
    }

    var recordAudio =  function($scope, Data) {
        //$('#prepareRecord').attr("disabled", true);
        $('#record').unbind();
        $('#record').html('Stop recording');
        $('#stop').bind('touchstart', function() {
            stopRecording();
        });
        src = 'touba_voice/'
        src += ((Data.fileName==null||Data.fileName === 'undefined') ? 'recording_' + Math.round(new Date().getTime()/1000) : Data.fileName)+Data.ext;
        audioRecording = new Media(src, onSuccess, onError);
        Data.countdownInt = 3;
        var startCountdown = setInterval(function() {
            $('#message').html('Recording will start in ' + Data.countdownInt + ' seconds...');
            Data.countdownInt = Data.countdownInt -1;
            if(Data.countdownInt <= 0) {
                Data.countdownInt = 3;
                clearInterval(startCountdown);
                audioRecording.startRecord();
                var recTime = maxTime;
                recInterval = setInterval(function() {
                    recTime = recTime - 1;
                    var timeRun = maxTime - recTime
                    $('#message').html(Math.floor(timeRun/60) +':' + timeRun%60);
                    var progress = 100-((100/maxTime) * recTime);
                    $( "#progressbar" ).progressbar({
                        value: progress
                    });
                    $( "#progressbar" ).on( "progressbarcomplete", function( event, ui ) {
                        //alert('Max time reached')
                    } );
                    if (recTime <= 0) {
                        stopRecording();
                    }
                }, 1000);
            }
        }, 1000);
    }

    function onSuccess() {
        $('#message').html('Audio file successfully created:<br />' + src);
        send(src); //will be removed TODO
    }

    function send(recordURI) {
        console.log('RECORD URI : ' + recordURI);
        $("#message").html("<p>Sending "+recordURI+"</p>");
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = Data.fileName + Data.ext; //recordURI.substr(src.lastIndexOf('/')+1);
        options.mimeType = Data.ext==='.mp3'?"audio/mpeg":"audio/x-wav"; //audio/mpeg    audio/x-wav
        options.chunkedMode = false;
        var fileTransfer = new FileTransfer();
        /*fileTransfer.onprogress = function(progressEvent) {
         if (progressEvent.lengthComputable) {
         //loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
         var progress = 100-((100/progressEvent.total) * progressEvent.loaded );
         $( "#progressbar" ).progressbar({
         value: progress
         });
         } else {
         //loadingStatus.increment();
         }
         };*/
        fileTransfer.upload(
            '/sdcard/'+recordURI,
            SERVER_ADDRESS+'/records', // Remote server for uploading record
            fileUploaded,
            onError,
            options
        );
        //$('#message').html('Audio file successfully sent:<br />' + src);
    }

    function fileUploaded(result) {
        $("#message").html('<p>Upload complete!!<br />Bytes sent: ' + result.bytesSent + '</p>');
        //$("#returnMessage").attr("src", result.response);
    }

    function onError(error) {
        $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
        console.dir(error)
    }
}