var fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    db;

// Create the "uploads" folder if it doesn't exist
fs.exists(__dirname + '/uploads', function (exists) {
    if (!exists) {
        console.log('Creating directory ' + __dirname + '/uploads');
        fs.mkdir(__dirname + '/uploads', function (err) {
            if (err) {
                console.log('Error creating ' + __dirname + '/uploads');
                process.exit(1);
            }
        })
    }
});

// Connect to database
var url = "mongodb://localhost:27017/touba_voice";
MongoClient.connect(url, {native_parser: true}, function (err, connection) {
    if (err) {
        console.log("Cannot connect to database " + url);
        process.exit(1);
    }
    db = connection;
});

exports.getRecords = function(req, res, next) {
    var records = db.collection('records');

    records.find().sort({ _id: -1 }).limit(10).toArray(function (err, data) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.json(data);
    });
};

exports.addRecord = function(req, res, next) {

    console.log("upload");

    var file = req.files.file,
        filePath = file.path,
//        fileName = file.name, file name passed by client. Not used here. We use the name auto-generated by Node
        lastIndex = filePath.lastIndexOf("/"),
        tmpFileName = filePath.substr(lastIndex + 1),
        record = req.body,
        records = db.collection('records');

    record.fileName = tmpFileName;
    console.log(tmpFileName);

    records.insert(record, function (err, result) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.json(record);
    });

};