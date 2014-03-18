function fileUploaded(result) {
    $("#messagePlayer").html('<p><b>Upload complete!!<br />Bytes sent: ' + result.bytesSent + '</b></p>');
    setTimeout(function(){
        $("#messagePlayer").html('');
    }, 1500)
}

function onError(error) {
    $('#message').html('code: ' + error.code + 'message: ' + error.message + '\n');
    console.dir(error)
}

function PlayerController($scope, $http, Record, Data) {
    $scope.isLocal=false;
    $scope.fetchRemoteRecords = function(){
        $scope.records = Record.query();
        $scope.isLocal=false;
        setTimeout(function(){
            $('[data-role=listview]').listview().listview('refresh')
        },1000)        
    }   
    
    $scope.fetchLocalRecords = function(){
        $scope.records = records;
        $scope.isLocal=true;
        setTimeout(function(){
            $('[data-role=listview]').listview().listview('refresh')
        },200)
        
    }
    
    if ($scope.records==null) {        
        $scope.records = Record.query();
        //$scope.fetchLocalRecords();
    }   

    $scope.selectRecord = function (fileName) {        
        $scope.record = _.where($scope.records, {name: fileName})[0];        
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
    
    $scope.removeRecord = function(){
        entry.getFile('touba_voice/'+ $scope.record.name, {create: false, exclusive: false}, function (fileEntry){
        console.log(fileEntry);
        fileEntry.remove(function (entry) {
                    console.log("Removal succeeded");
            }, function (error) {
                console.log("Error removing file: " + error.code);
            });
        }
        , function (error) {
            alert("Error deleting record" + $scope.record.name + ", error code :" + error.code);
        })
    }
    
    $scope.sendRecord = function () {
        var recordURI= 'touba_voice/'+$scope.record.name;       
        console.log('RECORD URI : ' + recordURI);
        $("#messagePlayer").html("<p>Sending "+recordURI+"</p>");
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = $scope.record.name; //recordURI.substr(src.lastIndexOf('/')+1);
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
            function(error){
                alert('code: ' + error.code + '\n' + 'message: ' + error.source||error.message||error.target + '\n');
            },
            options
        );        
    }
      
    var audioMedia = null,
        audioTimer = null,
        duration = -1,
        is_paused = false,
        mediaStatus;
        
    $("#playAudio").bind('touchstart', function() {
        //stopAudio();
        if($scope.isLocal){
            var srcLocal = '/sdcard/touba_voice/'+$scope.record.fileName||$scope.record.name;        
            playAudio(srcLocal); 
        }else{
            var srcRemote = SERVER_ADDRESS+'/'+$scope.record.fileName||$scope.record.name;        
            playAudio(srcRemote);
        }              
    });        
    
    $("#pauseaudio").bind('touchstart', function() {
        pauseAudio();
    });
    
    $("#stopaudio").bind('touchstart', function() {
        stopAudio();
    });
    
    $("#fastForwardAudio").bind('touchstart', function() {
        seekAudioTo(3);
    });
    
    $("#fastBackwardAudio").bind('touchstart', function() {
        seekAudioTo(-3);
    });

    function playAudio(src) {
        if (audioMedia === null) {
            $("#mediaDuration").html("0");
            $("#audioPosition").html("Loading...");
            audioMedia = new Media(src, onSuccess, onError, function(status){
                console.log('MEDIA STATUS AUDIO ' + status)
                mediaStatus = status;
                });
            audioMedia.play({ playAudioWhenScreenIsLocked : false });
        } else {
            if (is_paused) {
                is_paused = false;
                audioMedia.play();
            }else{
                is_paused = true;
                audioMedia.pause();
            }
        }
        if (audioTimer === null) {
            audioTimer = setInterval(function() {
                audioMedia.getCurrentPosition(
                    function(position) {
                        if (position > -1) {
                            setAudioPosition(Math.round(position));                            
                            if (duration <= 0) {
                                duration = audioMedia.getDuration();
                                if (duration > 0) {
                                    duration = Math.round(duration);
                                    $("#mediaDuration").html(duration);
                                }
                            }
                        }
                    },
                    function(error) {
                        console.log("Error getting position=" + error);
                        setAudioPosition("Error: " + error);
                    }
                );
            }, 1000);
        }
    }
    
    function seekAudioTo(second){
        if (second==null||second==='undefined') {
            second=1;
        }
        //console.log('AUDIO MEDIA OBJECT:' + audioMedia);
        if (audioMedia!=null && mediaStatus== 2) {            
            audioMedia.getCurrentPosition(
                function(position) {
                    if (position > -1) {
                        console.log('AUDIO MEDIA POSITION :' + Math.round(position));
                        newPosition = Math.round(position) + second;
                        if(newPosition>=audioMedia.getDuration()||newPosition<=0){
                            newPosition= Math.round(position);
                        }
                        audioMedia.seekTo(newPosition*1000);
                        setAudioPosition(newPosition);
                        if (duration <= 0) {
                            duration = audioMedia.getDuration();
                            if (duration > 0) {
                                duration = Math.round(duration);
                                $("#mediaDuration").html(duration);
                            }
                        }
                    }
                },
                function(error) {
                    console.log("Error getting position=" + error);
                    setAudioPosition("Error: " + error);
                }
            );            
        }
    }
    
    function backwardAudio() {
        
    }

    function pauseAudio() {
        if (is_paused) return;
        if (audioMedia) {
            is_paused = true;
            audioMedia.pause();
        }
    }

    function stopAudio() {
        if (audioMedia) {            
            audioMedia.release(); //let free resources !important
            //audioMedia.stop();
            audioMedia = null;
        }
        if (audioTimer) {
            clearInterval(audioTimer);
            audioTimer = null;
        }
        is_paused = false;
        duration = 0;
    }

    function setAudioPosition(position) {
        $("#audioPosition").html(position + " sec");
    }

    function onSuccess() {
        setAudioPosition(duration);
        clearInterval(audioTimer);
        audioTimer = null;
        audioMedia = null;
        is_paused = false;
        duration = -1;
    }
    function onError(error) {
        alert('code: ' + error.code + '\n' + 'message: ' + error.source||error.message||error.target + '\n');
        clearInterval(audioTimer);
        audioTimer = null;
        audioMedia = null;
        is_paused = false;
        setAudioPosition("0");
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
    };

    function stopRecording() {
        $("#progressbar" ).progressbar( "destroy" );
        $('#message').html('Audio file successfully created:<br />' + src);
        clearInterval(recInterval);
        audioRecording.stopRecord();
        recordPrepare();
    }

    var recordAudio =  function($scope, Data) {        
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
        //send(src); //will be removed TODO
    }

    
}