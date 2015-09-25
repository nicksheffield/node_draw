var url = location.protocol + '//' + location.hostname + ':9001'
var socket = io.connect(url)
var canvas = document.getElementById('c')
var ctx = canvas.getContext('2d')
var shapes = []
var players = {}
var mouse = {x: undefined, y: undefined, ox: undefined, oy: undefined}
var drawMode = false
var color = '#'+Math.floor(Math.random()*16777215).toString(16)
var width = 1

window.addEventListener('resize', setSize)

function setSize() {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight - 50
}

setSize()

socket.on('welcome', function(data) {
	console.log('Socket.IO Connected')
	shapes = data
	players[socket.id] = {}
})

socket.on('wipe', function() {
	shapes = []
})

$('#width').on('input', function() {
	width = $(this).val()
	$(this).next().text(width)
	
	if(players[socket.id]) {
		players[socket.id].radius = width
		socket.emit('update_player', players[socket.id])
	}
	
}).trigger('input')

$('#color').val(color).on('input', function() {
	color = $(this).val()
	
	$(this).next().text(color)
	
	if(players[socket.id]) {
		players[socket.id].color = color
		socket.emit('update_player', players[socket.id])
	}
	
}).trigger('input')

$('#clear').on('click', function() {
	if(confirm('Are you sure? This will delete everybodies drawings.')) {
		socket.emit('clear')
	}
})

function updateMouse(event) {
	mouse.ox = mouse.x
	mouse.oy = mouse.y
	mouse.x = event.layerX
	mouse.y = event.layerY
}

canvas.addEventListener('mousedown', function(e) {
	e.preventDefault()
	updateMouse(e)
	
	drawMode = true
})

canvas.addEventListener('mouseup', function(e) {
	drawMode = false
	
	if(mouse.x == mouse.ox && mouse.y == mouse.oy) {
		var dot = {
			type: 'dot',
			x: mouse.x,
			y: mouse.y,
			radius: width,
			color: color
		}
		
		shapes.push(dot)
		socket.emit('draw_shape', dot)
	}
	updateMouse(e)
})

canvas.addEventListener('mousemove', function(e) {
	updateMouse(e)
	
	if(drawMode) {
		var line = {
			type: 'line',
			x1: mouse.x,
			y1: mouse.y,
			x2: mouse.ox,
			y2: mouse.oy,
			width: width,
			color: color
		}
		
		shapes.push(line)
		socket.emit('draw_shape', line)
	}
	
	if(players[socket.id]) {
		players[socket.id].x = mouse.x
		players[socket.id].y = mouse.y
		players[socket.id].color = color
		players[socket.id].radius = width
	}
	
	socket.emit('update_player', players[socket.id])
})

socket.on('shape_drawn', function(line) {
	shapes.push(line)
})

socket.on('player_updated', function(player) {
	players[player.id] = player.data
	players[player.id].u = player.u
})

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	
	for(var i=0; i<shapes.length; i++) {
		var shape = shapes[i]
		
		if(shape.type == 'dot') drawDot(shape)
		if(shape.type == 'line') drawLine(shape)
	}
	
	for(var prop in players) {
		var player = players[prop]
		
		drawDot(player)
		
		if(prop != socket.id && (new Date()).valueOf() - player.u > 1000) {
			delete players[prop]
		}
	}
}


function drawLine(line) {
	ctx.lineCap = 'round'
	ctx.beginPath()
	ctx.moveTo(line.x1, line.y1)
	ctx.lineTo(line.x2, line.y2)
	ctx.strokeStyle = line.color
	ctx.lineWidth = line.width
	ctx.stroke()
}

function drawDot(dot) {
	ctx.beginPath()
	ctx.arc(dot.x, dot.y, dot.radius / 2, 0, 2*Math.PI)
	ctx.closePath()
	ctx.fillStyle = dot.color
	ctx.fill()
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60)
          }
})();


// usage:
// instead of setInterval(render, 16) ....

(function animloop(){
  requestAnimFrame(animloop)
  render()
})()
// place the rAF *before* the render() to assure as close to
// 60fps with the setTimeout fallback.