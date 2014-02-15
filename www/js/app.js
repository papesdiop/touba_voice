/**
 * Created by papesdiop on 2/3/14.
 */
var toubaApp = angular.module('toubaApp', ['ui.bootstrap','ui.router','ngResource']);

toubaApp.config(function($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/signin");
    //
    // Now set up the states
    $stateProvider
        .state('signin', {
            url: "/signin",
            templateUrl: "partials/signin.html"
        })
        .state('content', {
            url: "/content",
            templateUrl: "partials/content.html"
        })
        .state('content.recorder', {
            url: "/recorder",
            templateUrl: "partials/content.recorder.html"
        })
        .state('content.player', {
            url: "/player",
            templateUrl: "partials/content.player.html",
            controller: 'PlayerCtrl'
        })
});

toubaApp.factory('Data', function(){
    return {
        fileName: 'My Recording',
        ext: '.wav', //file extension .mp3, .wav
        maxTime : 10, // Max time for record in seconde
        //countdownInt : 3,
        src:null
    }
})

var maxTime = 10, // Max time for record in seconde
    src,
    audioRecording,
    stopRecording,
    recInterval,
    SERVER_ADDRESS = 'http://toubavoiceserver-software.rhcloud.com';

document.addEventListener("deviceready", onDeviceReady, false);

/** Records directory creation **/
function onGetDirectorySuccess(dir) {
    console.log("Created dir "+ dir.name);
}

function onGetDirectoryFail(error) {
    //alert("Error creating directory" + error.code);
}
function onRequestFileSystemSuccess(fileSystem) {
    var entry=fileSystem.root;
    entry.getDirectory("touba_voice/", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
    //var tmpPath = fileSystem.root.fullPath + "/touba_voice";
    //window.resolveLocalFileSystemURI(tmpPath, null, fail);
}

function success(entries) {
    var i;
     var objectType;
     for (i=0; i<entries.length; i++) {
     if(entries[i].name.contains(recordsDirectory)){


     }
     $('#directoryList').append('<li><h3>' + entries[i].name +
     '</h3><p>' + entries[i].toURI() + '</p><p class="ui-li-aside">Type:<strong>' + entries[i].name + '</strong></p></li>');
     }
     $('#directoryList').listview("refresh");
}

function onDeviceReady($scope, Data) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
}

/**End**/

toubaApp.factory('RecordRest', ['$resource',
    function($resource){
        return $resource(SERVER_ADDRESS+'/records/:id', {Id: "@Id" }, {
            query: {method:'GET', params:{}, isArray:true}
        });
    }]);

toubaApp
    .controller('PlayerCtrl', function($scope, $resource, Data, RecordRest){
       $scope.records = RecordRest.query() ;

        console.log($scope.records)

    })
    .controller('RecordCtrl', function($scope, $modal, $log, Data){
        $scope.data = Data;
        $scope.max = 100;

        var recordPrepare = $scope.recordPrepare = function () {
            $('#prepareRecord').attr("disabled", false);
            $('#record').unbind();
            $('#record').html('Start recording');
            $('#record').bind('touchstart', function (){
                recordAudio($scope, Data)
            });
        };

        $scope.open = function () {

            var modalInstance = $modal.open({
                templateUrl: 'fileModal',
                controller: ModalInstanceCtrl,
                resolve: {
                    data: function () {
                        return $scope.data;
                    }
                }
            });

            modalInstance.result.then(function (fileName) {
                $scope.data.fileName = fileName;
                //$log.info('FileName saved as: ' + fileName);
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
        };

        var ModalInstanceCtrl = function ($scope, $modalInstance, data) {
            $scope.data = data
            $scope.ok = function () {
                $modalInstance.close($scope.data.fileName);
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
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
                        var prog = 100-((100/maxTime) * recTime);
                        $( "#progressbar" ).progressbar({
                            value: prog
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
            //send(src); //will be removed
        }

        function send(recordURI) {
            console.log('RECORD URI : ' + recordURI);
            $("#message").html("<p>Sending "+recordURI+"</p>");
            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = Data.fileName + Data.ext; //recordURI.substr(src.lastIndexOf('/')+1);
            options.mimeType = "audio/x-wav"; //audio/mpeg    audio/x-wav
            options.chunkedMode = false;
            var fileTransfer = new FileTransfer();
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

    })