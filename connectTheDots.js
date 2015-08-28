/*
 This is free software.
 License: GNU Affero General Public License 3
 matthias.graf <a> mgrf.de
 */


function clear() {
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, width, height)
}

function getMousePos(obj, evt) {
	var rect = obj.getBoundingClientRect()
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top,
		time: Date.now()
	}
}

function drawCircle(position, radius) {
	var path = new Path2D()
	path.arc(position.x, position.y, radius, 0, Math.PI*2, true)
	ctx.fill(path)
}

function distanceTo(node1, node2) {
	var dx = Math.abs(node1.x-node2.x)
	var dy = Math.abs(node1.y-node2.y)
	return Math.sqrt(dx*dx + dy*dy)
}

function findConnections(graph, node) {
	var connected = []
	graph.nodes.forEach(function (n) {
		if (n !== node && distanceTo(n, node) < radius*2) {
			connected.push(n)
		}
	})
	return connected
}

function getConnectedNodes(graph, node) {
	return graph.edges.filter(function(edge) { return (edge[0] === node) || (edge[1] === node) })
		.map(function(e) { return e[0] === node ? e[1] : e[0]})
}

function pathExistsBetweenStartAndGoal(graph) {
	var visited = [graph.startNode]
	var front = [graph.startNode]
	while(front.length > 0) {
		var e = front[0]
		if (e === graph.endNode)
			return true
		var connectedAndNotVisited = getConnectedNodes(graph, e)
			.filter(function(x) { return visited.indexOf(x) === -1})
		connectedAndNotVisited.forEach(function(x) { visited.push(x) })
		connectedAndNotVisited.forEach(function(x) { front.push(x) })
		front.shift()
	}
	return false
}

function fillArrayXtimesWithResultOf(x, fn) {
	var array = []
	for (var i=0; i<x; i++)
		array.push(fn())
	return array
}

// in order to play a sound that OVERLAYs each other, multiple Audio objects have to be created
function createAudioPool(file) {
	return {
		audio: fillArrayXtimesWithResultOf(20, function() { return new Audio(file) }),
		play: function() {
			for (var i=0; i<this.audio.length; i++) {
				if (this.audio[i].paused) {
					this.audio[i].play()
					break
				}
			}
		}
	}
}

var drawNode = function(color) {
	return function(nodeIndex) {
		console.assert(this.nodes.length > nodeIndex)
		ctx.fillStyle = color
		drawCircle(this.nodes[nodeIndex], radius)
	}
}


function edgesIntersect(a,b) {
	return intersects(a[0].x, a[0].y, a[1].x, a[1].y, b[0].x, b[0].y, b[1].x, b[1].y)
}

// http://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function intersects(a,b,c,d,p,q,r,s) {
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
}

function cutThroughEdges(graphToTruncate, cuttingEdge /*har!*/) {
	var didCutSome = false
	for (var i=0; i<graphToTruncate.edges.length; ) {
		var edge = graphToTruncate.edges[i]
		if (edgesIntersect(edge, cuttingEdge)) {
//				console.log("cutting edge!")
			didCutSome = true
			graphToTruncate.edges.splice(i, 1)
		} else {
			i++
		}
	}
	return didCutSome
}

function getAllReachableNodesFromStartAndEnd(graph) {
	var visited = [graph.startNode, graph.endNode]
	var front = [graph.startNode, graph.endNode]
	while(front.length > 0) {
		var connectedAndNotVisited = getConnectedNodes(graph, front[0])
			.filter(function(x) { return visited.indexOf(x) === -1})
		connectedAndNotVisited.forEach(function(x) { visited.push(x) })
		connectedAndNotVisited.forEach(function(x) { front.push(x) })
		front.shift()
	}
	return visited
}

function truncateGraphIfNodesAreNotConnected(graphToTruncate) {
	var reachableNodes = getAllReachableNodesFromStartAndEnd(graphToTruncate)
	var cutSomeNodes = false
	for (var i=0; i<graphToTruncate.nodes.length; ) {
		var node = graphToTruncate.nodes[i]
		if (reachableNodes.indexOf(node) === -1) {
//				console.log("cutting node!")
			cutSomeNodes = true
			// first, delete all of its edges
			for (var k=0; k<graphToTruncate.edges.length; ) {
				var edge = graphToTruncate.edges[k]
				if (edge[0] === node || edge[1] === node) {
//						console.log("cutting edge! (from node)")
					graphToTruncate.edges.splice(k, 1)
				} else {
					k++
				}
			}
			graphToTruncate.nodes.splice(i, 1)
		} else {
			i++
		}
	}
	return cutSomeNodes
}


function newGraph(startNode, endNode, color) {
	return {
		startNode: startNode,
		endNode: endNode,
		color: color,
		draw: drawNode(color),
		init: function() {
			this.nodes = [this.startNode, this.endNode]
			this.edges = []
			return this
		}
	}.init()
}

function isPaused() {
	return Date.now() - lastPauseStart < pauseTimeAfterReset
}

function update(mousePos) {
	if (isPaused()) {
		soundSonar.play()
		return
	}

	if (mousePos) {
		var connectedA = findConnections(graphA, mousePos).sort(function(a, b) { return a.time > b.time ? 1 : -1})
		var connectedB = findConnections(graphB, mousePos).sort(function(a, b) { return a.time > b.time ? 1 : -1})
		var lastA = connectedA.length === 0 ? {time: -1} : connectedA[connectedA.length-1]
		var lastB = connectedB.length === 0 ? {time: -1} : connectedB[connectedB.length-1]
		var graphToAddTo = lastA.time > lastB.time ? graphA : graphB
		var graphToPunish = lastA.time > lastB.time ? graphB : graphA
		var connected =  lastA.time > lastB.time ? connectedA : connectedB

		if (connected.length > 0) {
			graphToAddTo.nodes.push(mousePos)
			connected.forEach(function(c) {
				graphToAddTo.edges.push([c, mousePos])
			})
			var didCutSome = false
			connected.forEach(function(c) {
				didCutSome |= cutThroughEdges(graphToPunish, [c, mousePos])
			})
			if (didCutSome) {
				var cutSomeNodes = truncateGraphIfNodesAreNotConnected(graphToPunish)
				if (cutSomeNodes) {
					soundCutoff.play()
				}
			}

			if (graphToAddTo === graphA)
				soundRed.play()
			else
				soundBlue.play()
		} else {
			// miss
			soundSonar.play()
		}
		if (pathExistsBetweenStartAndGoal(graphA)) {
			gameEnd(graphA)
			return
		}
		if (pathExistsBetweenStartAndGoal(graphB)) {
			gameEnd(graphB)
			return
		}

	}

	redraw()
}

function redraw() {
	clear()
	var iA = 0, iB = 0
	graphA.nodes.sort(function(a, b) { return a.time > b.time ? 1 : -1})
	graphB.nodes.sort(function(a, b) { return a.time > b.time ? 1 : -1})
	while (graphA.nodes.length > iA || graphB.nodes.length > iB) {
		var nA = graphA.nodes.length > iA ? graphA.nodes[iA] : {time: Number.MAX_VALUE}
		var nB = graphB.nodes.length > iB ? graphB.nodes[iB] : {time: Number.MAX_VALUE}
		if (nA.time > nB.time) {
			graphB.draw(iB)
			iB++
		} else {
			graphA.draw(iA)
			iA++
		}
	}
}

function gameEnd(graphThatWon) {
	soundFinished.play()
	lastPauseStart = Date.now()
	reset(graphThatWon)
}

function reset(graphThatWon) {
	graphA.init()
	graphB.init()
	redraw()

	if (graphThatWon) {
		ctx.fillStyle = graphThatWon.color
		ctx.textAlign = "center"
		ctx.font = radius+"px serif"
		ctx.fillText(graphThatWon.color+" won!", width/2, height/2-radius*1.1)
		ctx.fillText("restart in "+Math.round(pauseTimeAfterReset/1000)+" seconds...", width/2, height/2)
		window.setTimeout(reset, pauseTimeAfterReset)
	} else {
		soundReady.play()
		ctx.fillStyle = "black"
		ctx.textAlign = "center"
		ctx.font = radius+"px serif"
		ctx.fillText("Connect the dots!", width/2, height/2)
	}
}

var height = window.innerHeight
var width = window.innerWidth
var canvas = document.createElement("canvas")
document.body.appendChild(canvas)
canvas.setAttribute("style", "position: absolute;")
canvas.setAttribute("width", width)
canvas.setAttribute("height", height)
var ctx = canvas.getContext("2d")
var radius = Math.min(width, height)*0.08
var lastPauseStart = 0
var pauseTimeAfterReset = 5000 // ms

var margin = radius*2
// the start zones should always be on top, so make the time bigger then anything else
// >> Date.now()
var t = 1e15
var graphA = newGraph({x: margin, y: margin, time: t}, {x: width-margin, y: height-margin, time: t}, "red")
var graphB = newGraph({x: margin, y: height-margin, time: t}, {x: width-margin, y: margin, time: t}, "blue")

//var soundDir = "http://mgrf.de/temp/cdgGameJam/"
var soundDir = "sounds/"
var soundSonar = createAudioPool(soundDir+"sonar.ogg")
var soundRed = createAudioPool(soundDir+"message-new-instant.ogg")
var soundBlue = createAudioPool(soundDir+"button-pressed.ogg")
var soundFinished = createAudioPool(soundDir+"service-login.ogg")
var soundCutoff = createAudioPool(soundDir+"glass.ogg")
var soundReady = createAudioPool(soundDir+"system-ready.ogg")

canvas.addEventListener("mousedown", function(event) {
	update(getMousePos(canvas, event))
})

reset()

// this is only working in the room operating system of the Communications Design Group :)
// multiple lasers can hit the wall, each is creating a new dot
if (typeof db != "undefined") {
	db.addResponder({
		from:"lasered objects", f:function (item, event) {
			if (item.object_id === db.self_id) {
				if (event === "create") {
					var position = {
						x: item.point[0]*width,
						y: item.point[1]*height,
						time: Date.now()
					}
					update(position)
				}
			}
		}
	})

}

console.log("done loading: connect the dots!")

