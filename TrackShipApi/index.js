var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var validator = require('validator');
var request = require('request');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'hackathon',
    database : 'TrackShip'
});

app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    }
    else {
        next();
    }
});

app.post('/projects', function(req, res) {
	var uuid = require('uuid');
	var body = req.body,
        name     = validator.toString(body.name),
	id	 = validator.toString(uuid.v4());

    	if (!name) {
		res.status(400).send({'message':'missing name'});
		return;
	}

	if (!id) {
                res.status(400).send({'message':'bad id generated'});
                return;
        }

	connection.query("INSERT INTO projects (id,name) VALUES (?,?);", [id, name], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
	    res.status(200).send({'project_id':id});
        }
    });
});

app.delete('/material/:material_id', function(req, res) {
        var material_id = validator.toString(req.params.material_id);

        if (!material_id) {
                res.status(400).send({'message':'bad material_id specified'});
                return;
        }

        connection.query("DELETE IGNORE FROM materials WHERE id = ?", material_id, function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send({'message':'success'});
        }
    });
});

app.get('/user/:user_id/projects', function(req, res) {
	var user_id = req.params.user_id;

    connection.query("SELECT projects.* FROM projects INNER JOIN project_user ON project_user.project_id = projects.id AND project_user.user_id = ? ORDER BY projects.name ASC", user_id, function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
});

app.post('/user/:user_id/projects', function(req, res) {
        var body   = req.body,
        project_id = validator.toString(body.project_id),
        user_id    = validator.toString(req.params.user_id);

        if (!user_id || !project_id) {
                res.status(400).send({'message':'bad user_id or project_id specified'});
                return;
        }

        connection.query("INSERT INTO project_user (project_id,user_id) VALUES (?,?);", [project_id, user_id], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send({'message':'success'});
        }
    });
});

app.delete('/user/:user_id/projects', function(req, res) {
        var body   = req.body,
        project_id = validator.toString(body.project_id),
        user_id    = validator.toString(req.params.user_id);

        if (!user_id || !project_id) {
                res.status(400).send({'message':'bad user_id or project_id specified'});
                return;
        }

        connection.query("DELETE IGNORE FROM project_user WHERE project_id = ? AND user_id = ?", [project_id, user_id], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            connection.query("DELETE IGNORE FROM subscriptions WHERE user_id = ? AND material_id IN (SELECT materials.id FROM materials WHERE materials.project_id = ?)", [user_id, project_id], function(err, rows) {
            	if (err) {
            	    res.status(400).send(err);
            	} else {
            	    res.status(200).send({'message':'success'});
             	}
	    });
        }
    });
});

app.post('/project/:project_id/materials', function(req, res) {
        var uuid = require('uuid');
	var body    = req.body,
        project_id  = validator.toString(req.params.project_id),
        material_id = validator.toString(uuid.v4()),
	name	    = validator.toString(body.name),
	description = validator.toString(body.description);

        if (!name) {
                res.status(400).send({'message':'bad name specified'});
                return;
        }

        connection.query("INSERT INTO materials (id,project_id,name,description) VALUES (?,?,?,?);", [material_id, project_id, name, description], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send({'material_id':material_id});
        }
    });
});

app.get('/project/:project_id/materials', function(req, res) {
        var project_id  = validator.toString(req.params.project_id);

        if (!project_id) {
                res.status(400).send({'message':'bad project_id specified'});
                return;
        }

        connection.query("SELECT materials.* FROM  materials WHERE materials.project_id = ? ORDER BY materials.name ASC", project_id, function(err, rows) {
        if (err) {
            res.status(400).send(err);
	} else {
            res.status(200).send(rows);
        }
    });
});

app.get('/project/:project_id/materials/user/:user_id', function(req, res) {
        var project_id  = validator.toString(req.params.project_id),
	    user_id	= validator.toString(req.params.user_id);

        if (!project_id || !user_id) {
                res.status(400).send({'message':'bad project_id or user_id specified'});
                return;
        }

        connection.query("SELECT materials.*, CASE WHEN subscriptions.user_id IS NOT NULL THEN 1 ELSE 0 END as subscribed FROM materials LEFT JOIN subscriptions ON subscriptions.material_id = materials.id AND subscriptions.user_id = ? WHERE materials.project_id = ? ORDER BY materials.name ASC", [user_id, project_id], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
});

app.post('/subscribe', function(req, res) {
	var uuid = require('uuid');
        var body        = req.body,
        user_id         = validator.toString(body.user_id),
        subscription_id = validator.toString(uuid.v4()),
        material_id     = validator.toString(body.material_id);

        if (!user_id || !material_id) {
                res.status(400).send({'message':'bad user_id or material_id specified'});
                return;
        }

        connection.query("INSERT INTO subscriptions (id, material_id, user_id) VALUES (?, ?, ?)", [subscription_id, material_id, user_id], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send({'subscription_id':subscription_id});
        }
    });
});

app.delete('/unsubscribe', function(req, res) {
        var body        = req.body,
        user_id         = validator.toString(body.user_id),
        subscription_id = validator.toString(body.subscription_id),
        material_id     = validator.toString(body.material_id);

        if ((!user_id || !material_id) && !subscription_id) {
                res.status(400).send({'message':'bad user_id, material_id, or subscription_id specified'});
                return;
        }

	if (subscription_id) {
	    connection.query("DELETE IGNORE FROM subscriptions WHERE id = ?", subscription_id, function(err, rows) {
       	 	if (err) {
            		res.status(400).send(err);
        	} else {
            		res.status(200).send({'message':'success'});
        	}
	    });
	    return;
    	} else {
            connection.query("DELETE FROM subscriptions WHERE user_id = ? AND material_id = ?", [user_id, material_id], function(err, rows) {
                if (err) {
                        res.status(400).send(err);
                } else {
                        res.status(200).send({'message':'success'});
                }
            });
            return;
        }
});

app.post('/notify', function(req, res) {
        var uuid = require('uuid');
        var body        = req.body,
        id              = validator.toString(uuid.v4()),
        project_id      = validator.toString(body.project_id),
        material_id     = validator.toString(body.material_id),
	message		= validator.toString(body.message);

        if (!id || !project_id) {
                res.status(400).send({'message':'bad user_id or material_id specified'});
                return;
        }

        connection.query("INSERT INTO notifications (id, project_id, material_id, message) VALUES (?, ?, ?, ?)", [id, project_id, material_id, message], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
	    connection.query("SELECT DISTINCT project_user.user_id FROM project_user INNER JOIN notifications ON notifications.project_id = project_user.project_id AND notifications.id = ? LEFT JOIN subscriptions ON subscriptions.user_id = project_user.user_id AND subscriptions.material_id = notifications.material_id WHERE (notifications.material_id IS NULL OR notifications.material_id = '') OR (notifications.material_id IS NOT NULL AND subscriptions.user_id IS NOT NULL);", id, function(err, rows) {
       		 if (err) {
            		res.status(400).send(err);
       	 	} else {
			var ids;
			//res.status(200).send(rows);

			var ids = [];
			for (var i = 0; i < rows.length; i++) {
   	 			ids.push(rows[i].user_id);
			}
			var options = {
        		url: 'https://push.ionic.io/api/v1/push',
        		headers: {
            			'X-Ionic-Application-Id': 'c1ff212f',
            			'Authorization': 'Basic MjBkYjczOGJiYjBlZDQ1OWU2MDhlZWMwYjYwNzVmYTdlZGVmZjE4NzQxYjQ5M2JlOg==',
        		},
        		json: {
            			"tokens":ids,
            			"notification": {
                			"alert":message
            			}
        		}
    			};

    			request.post(options, function (error, response, body) {
        			res.send(response);
				console.log(body);
    			});

        	}
    	    });
        }
    });
});

app.get('/user/:user_id/notifications', function(req, res) {
        var user_id  = validator.toString(req.params.user_id);

        if (!user_id) {
                res.status(400).send({'message':'bad user_id specified'});
                return;
        }

        connection.query("SELECT DISTINCT notifications.* FROM notifications as notifications INNER JOIN project_user ON project_user.project_id = notifications.project_id AND project_user.user_id = ? LEFT JOIN subscriptions ON subscriptions.material_id = notifications.material_id WHERE notifications.material_id IS NULL OR notifications.material_id = '' OR subscriptions.user_id = ? ORDER BY timestamp desc LIMIT 10", [user_id, user_id], function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
});

app.get('/users', function(req, res) {
    connection.query("select user_id, user_name from user", function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else if (!rows[0]) {
            res.status(409).send({'message':'no users.'});
        } else {
            res.status(200).send(rows);
        }
    });
});

app.get('/buildings/user/:user_id', function(req, res) {
    var user_id = req.params.user_id;
    connection.query("select building.building_id, building.address from building INNER JOIN building_user ON building_user.building_id = building.building_id AND building_user.user_id = ?", user_id, function(err, rows) {
        if (err) {
            res.status(400).send(err);
        } else if (!rows[0]) {
            res.status(409).send({'message':'no buildings.'});
        } else {
            res.status(200).send(rows);
        }
    });
});

var server = app.listen(8080, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);

});
