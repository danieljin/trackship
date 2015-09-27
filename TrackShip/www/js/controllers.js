angular.module('trackship.controllers', [])
.controller('MainCtrl', function($scope, $rootScope, $ionicUser, $ionicPush, $log) {
  // Handles incoming device tokens
  $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    alert("Successfully registered token " + data.token);
    $log.info('Ionic Push: Got token ', data.token, data.platform);
    $scope.token = data.token;
  });

  $log.info('Ionic User: Identifying with Ionic User service');

  var user = $ionicUser.get();
  if(!user.user_id) {
    // Set your user_id here, or generate a random one.
    user.user_id = $ionicUser.generateGUID();
  };

  // Identify your user with the Ionic User Service
  $ionicUser.identify(user).then(function(){
    $scope.identified = true;

    $log.info('Ionic Push: Registering user');
    // Register with the Ionic Push service.  All parameters are optional.
    $ionicPush.register({
      canShowAlert: true, //Can pushes show an alert on your screen?
      canSetBadge: true, //Can pushes update app icon badges?
      canPlaySound: true, //Can notifications play a sound?
      canRunActionsOnWake: true, //Can run actions outside the app,
      onNotification: function(notification) {
        // Handle new push notifications here
        // $log.info(notification);
        return true;
      }
    });
  });
})
.controller('NewProjectCtrl', function($scope, $ionicHistory, $http, $location) {
  $scope.project = {};
  $scope.submit = {disabled:true};
  $scope.myGoBack = function() {
    $ionicHistory.goBack();
  };
  $scope.toggleSubmit = function() {
    if ($scope.project.name.length > 0) {
      $scope.submit.disabled = false;
    } else {
      $scope.submit.disabled = true;
    };
  }
  $scope.createProject = function() {
    $http({
      method: 'POST',
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/projects',
      data: {name:$scope.project.name},
      headers: {
        'Content-Type': 'application/json'
      }
    }).
    success(function(data, status, headers, config) {
      $http({
        method: 'POST',
        url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/projects',
        data: {project_id:data.project_id},
        headers: {
          'Content-Type': 'application/json'
        }
      }).
      success(function(data, status, headers, config) {
        $location.path("/landing");
      }).
      error(function(data, status, headers, config) {
        alert(JSON.stringify(data));
      });
    }).
    error(function(data, status, headers, config) {
      alert(JSON.stringify(data));
    });
  };
})
.controller('JoinProjectCtrl', function($scope, $ionicHistory, $http, $location) {
  $scope.project = {};
  $scope.submit = {disabled:true};
  $scope.myGoBack = function() {
    $ionicHistory.goBack();
  };
  $scope.toggleSubmit = function() {
    if ($scope.project.id.length > 0) {
      $scope.submit.disabled = false;
    } else {
      $scope.submit.disabled = true;
    };
  }
  $scope.joinProject = function() {
      $http({
        method: 'POST',
        url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/projects',
        data: {project_id:$scope.project.id},
        headers: {
          'Content-Type': 'application/json'
        }
      }).
      success(function(data, status, headers, config) {
        $location.path("/landing");
      }).
      error(function(data, status, headers, config) {
        alert('This project does not exist');
      });
  };
});
