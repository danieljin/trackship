angular.module('trackship.controllers', [])
.controller('MainCtrl', function($scope, $rootScope, $ionicUser, $ionicPush, $log, $ionicLoading, $http, $ionicModal, $ionicPopup) {
  // $ionicLoading.show({
  //   template: 'Loading...'
  // });
  // Handles incoming device tokens
  $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    $log.info('Ionic Push: Got token ', data.token, data.platform);
    $scope.token = data.token;

    $http({
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/projects',
    }).
    success(function(data, status, headers, config) {
      $scope.projects = data;
    }).
    error(function(data, status, headers, config) {
      alert(data);
    });

    $http({
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/notifications',
    }).
    success(function(data, status, headers, config) {
      $scope.notifications = data;
    }).
    error(function(data, status, headers, config) {
      alert(data);
    });
  });

  $rootScope.$on('project-added', function() {
      $http({
        url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/projects',
      }).
      success(function(data, status, headers, config) {
        $scope.projects = data;
      }).
      error(function(data, status, headers, config) {
        alert(data);
      });
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
        alert(JSON.stringify(notification));
      }
    });
  });

  $scope.removeProject = function(id) {
    $http({
      method: 'DELETE',
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/user/' + $scope.token + '/projects',
      data: {project_id:id},
      headers: {
        'Content-Type': 'application/json'
      }
    }).
    success(function(data, status, headers, config) {
      $ionicLoading.show({
        template: 'Project has been removed.',
        duration: 1000
      });
      $rootScope.$emit('project-added');
    }).
    error(function(data, status, headers, config) {
      alert(JSON.stringify(data));
    });
  }

  $scope.showModal = function(id) {
    $scope.project_id = id;

    $ionicModal.fromTemplateUrl('templates/subscriptions.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
      modal.show();
    });
  }


  $scope.projects = [{name:'asdasds', id:'0c28f3b4-26df-400c-bcc3-0c936190d564'}];
  $scope.project_id;
  $scope.data = {};
})
.controller('NewProjectCtrl', function($scope, $ionicHistory, $http, $location, $rootScope) {
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
        $scope.project = {};
        $location.path("/landing");
        $rootScope.$emit('project-added');
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
.controller('JoinProjectCtrl', function($scope, $ionicHistory, $http, $location, $rootScope) {
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
      $scope.project = {};
      $location.path("/landing");
      $rootScope.$emit('project-added');
    }).
    error(function(data, status, headers, config) {
      alert('This project does not exist');
    });
  };
})
.controller('SubscriptionsCtrl', function($scope, $http, $ionicPopup) {
  $scope.materials = [];

  $scope.$on('materials-update', function() {
    $http({
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/project/' + $scope.project_id + '/materials/user/' + $scope.token,
    }).
    success(function(data, status, headers, config) {
      $scope.materials = data;
    }).
    error(function(data, status, headers, config) {
      alert(data);
    });
  });

  $scope.$emit('materials-update');

  $scope.addMaterial = function() {
    $ionicPopup.show({
      template: '<input type="text" ng-model="data.material">',
      title: 'Enter Material Name',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.material) {
              //don't allow the user to close unless he enters wifi password
              e.preventDefault();
            } else {
              $http({
                method: 'POST',
                url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/project/' + $scope.project_id + '/materials',
                data: {name:$scope.data.material},
                headers: {
                  'Content-Type': 'application/json'
                }
              }).
              success(function(data, status, headers, config) {
                $scope.data.material = "";
                $scope.$emit('materials-update');
              }).
              error(function(data, status, headers, config) {
                alert('This project does not exist');
              });
              return $scope.data.wifi;
            }
          }
        }
      ]
    });
  }

  $scope.subscribeMaterial = function(id) {
    $http({
      method: 'POST',
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/subscribe',
      data: {user_id:$scope.token, material_id:id},
      headers: {
        'Content-Type': 'application/json'
      }
    }).
    success(function(data, status, headers, config) {
      $scope.$emit('materials-update');
    }).
    error(function(data, status, headers, config) {
      alert(JSON.stringify(data));
    });
  }

  $scope.unsubscribeMaterial = function(id) {
    $http({
      method: 'DELETE',
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/unsubscribe',
      data: {user_id:$scope.token, material_id:id},
      headers: {
        'Content-Type': 'application/json'
      }
    }).
    success(function(data, status, headers, config) {
      $scope.$emit('materials-update');
    }).
    error(function(data, status, headers, config) {
      alert(JSON.stringify(data));
    });
  }

  $scope.notifyMaterial = function(id, name) {
    $http({
      method: 'POST',
      url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/notify',
      data: {
        project_id:$scope.project_id,
        material_id:id,
        message:name + " has arrived."
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).
    success(function(data, status, headers, config) {
      $scope.$emit('materials-update');
    }).
    error(function(data, status, headers, config) {
      alert(JSON.stringify(data));
    });
  }

  $scope.removeMaterial = function(id) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Deleting Material',
      template: 'Are you sure you want to delete this material?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        $http({
          method: 'DELETE',
          url: 'http://ec2-54-237-22-83.compute-1.amazonaws.com/material/' + id,
        }).
        success(function(data, status, headers, config) {
          $scope.$emit('materials-update');
        }).
        error(function(data, status, headers, config) {
          alert(JSON.stringify(data));
        });
      }
    });
  }
});
