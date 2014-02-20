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