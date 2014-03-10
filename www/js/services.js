var maxTime = 1000, // Max time for record in seconde
    src,
    audioRecording,
    stopRecording,
    recInterval,
    entry,
    directory,
    reader,
    records=[],
    SERVER_ADDRESS = 'http://toubavoiceserver-software.rhcloud.com';

document.addEventListener("deviceready", onDeviceReady, false);

function getPhoneGapPath() {

    var path = window.location.pathname;
    path = path.substr( path, path.length - 10 );
    return 'file://' + path;

};

//var snd = new Media( getPhoneGapPath() + 'test.wav' );

var appPath = getPhoneGapPath();


/** Records directory creation **/
function onRequestFileSystemSuccess(fileSystem) {
    entry= fileSystem.root;
    entry.getDirectory("touba_voice/", {create: true, exclusive: false},
        function (dir) {
            console.log("Created dir "+ dir.name);
            directory = dir;
            reader = directory.createReader();           
            reader.readEntries(
                function (entries) {
                    console.log("The dir has "+entries.length+" entries.");
                    // Scan for audio src
                    for (var i=0; i<entries.length; i++) {
                        console.log(entries[i].name+' dir? '+entries[i].isDirectory);
                        records.push({'_id': i,'fileName':entries[i].name, 'name':entries[i].name})
                        //TODO default limited list to 10
                        if (i>=10) {
                            break;
                        }
                    }                                                        
                },
                function (error) {
                    alert('onError(): '    + error.code    + '\n' +
                        'message: ' + error.message + '\n');
                })
                        
        }
        ,function (error) {
            alert("Error creating directory" + error.code);
        });
}

function onDeviceReady() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null);
}

var module1 = angular.module('RecordService', ['ngResource']).factory('Record', ['$resource', function ($resource) {
    var Record = $resource(SERVER_ADDRESS+'/records', {}, {
        update: { method: 'PUT'}
    });
    return Record;
    }])
    .factory('Data', function(){
        return {
            fileName: 'My Recording',
            ext: '.mp3', //file extension .mp3, .wav            
            src:null
        }
    })