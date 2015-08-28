
// get our pixel dimensions
var width = window.innerWidth, height = window.innerHeight;
// create a canvas
var canvas = document.createElement("canvas");
canvas.width = width; canvas.height = height;
document.body.appendChild(canvas);

var ufoAudio = document.createElement("audio");
// TODO: FIX sound!
//ufoAudio.setAttribute("src", "/v2/sounds/spaceships/ufo.wav");
document.body.appendChild(ufoAudio);

// get the canvas drawing context
var ctx = canvas.getContext("2d");
clear();

var ship = Ship();
var ufos = [UFO()];
var prevTimestamp = 0;
function tick(timestamp) {
    if ((timestamp - prevTimestamp) > 500) {
        ufos.push(UFO())
        prevTimestamp = timestamp;
    }
    clear();
    
    ship.tick();
    ufos.forEach(function(ufo, i) {
        if (ufo.shouldDelete) {
          delete ufos[i];
        }
        ufo.tick();
    });
  
    
    
    window.requestAnimationFrame(tick);
}

window.requestAnimationFrame(tick);

db.addResponder({
    // respond to changes in the "lasered objects" collection
    from:"lasered objects", f:function (item,event) {
        // only care about lasers inside self
        if (item.object_id === db.self_id) {
            if (event === "create" || event === "change") {
                // redraw the dot at its location
              
                var allLasers = db.find('lasered objects', {object_id:db.self_id});
                 
                var averageX = allLasers.reduce(function(prevValue, item) {
                  return prevValue+item.point[0]*width; // turn percentage x into pixel x
                }, 0)/allLasers.length;
              
                var averageY = allLasers.reduce(function(prevValue, item) {
                  return prevValue+item.point[1]*height; // turn percentage y into pixel y
                }, 0)/allLasers.length;
                
                ship.targetPosition[0] = averageX-ship.radius;
                ship.targetPosition[1] = averageY+ship.radius;
                
            }
            // if the laser has been removed
            else if (event === "delete") {
                clear();
           }
        }
    }
});

function clear() {
        ctx.clearRect(0,0,width,height);
}

function Ship() {
    var _ship = {};
    
    // state
    _ship.position = [0, height/2];
    _ship.targetPosition = [0, height/2];
    _ship.radius = 40;
    
    // methods
    _ship.render = function() {

        
        // debug
        /*
        ctx.beginPath();
        ctx.arc(this.position[0]+this.radius+5, this.position[1]-this.radius, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        */
        
        
        ctx.font = "80px Arial";
        ctx.fillStyle = '#fff';
        ctx.fillText('🚀', this.position[0], this.position[1])
    };
    _ship.tick = function() {
        var sensitivity = .1;
        this.position[0] = this.position[0] + sensitivity*(this.targetPosition[0]-this.position[0])
        
        this.position[1] = this.position[1] + sensitivity*(this.targetPosition[1]-this.position[1])

        this.render();
    };
    
    return _ship;
}

function UFO() {
    var _ufo = {};
    
    // state
    
    var randomHeight = Math.floor(Math.random() * height);
    _ufo.position = [width - 500, randomHeight];
    _ufo.width = 20;
    _ufo.height = 20;
    _ufo.shouldDelete = false;
    
    
    // methods
    _ufo.render = function() {
        ctx.font = "80px Arial";
        ctx.fillStyle = 'white';
        ctx.fillText('👾', this.position[0], this.position[1])
    };
    _ufo.tick = function() {
        
        this.position[0] = this.position[0] - 10;
        if (this.position[0] < 0) {
			this.shouldDelete = true;
        }
        
        this.render();
    };

    //ufoAudio.play();
    
    return _ufo;
}

console.log("ufo loaded");
