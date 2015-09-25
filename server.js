var chalk = require('chalk')
var express = require('express')
var io = require('socket.io')()

// Express
var app = express()
app.listen(9000)
app.use(express.static('./public'))

// Socket.IO
io.listen(9001)

var shapes = []

io.on('connection', function(socket) {
	console.log(' - ' + chalk.green('Connection') + ': ' + socket.id)
	
	socket.emit('welcome', shapes)
	
	socket.on('draw_shape', function(data) {
		console.log(' - ' + chalk.yellow('shape_drawn') + ': ', JSON.stringify(data))
		socket.broadcast.emit('shape_drawn', data)
		
		shapes.push(data)
	})
	
	socket.on('update_player', function(data) {
		console.log(' - ' + chalk.yellow('player_updated') + ': ', JSON.stringify(data))
		socket.broadcast.emit('player_updated', {
			id: socket.id,
			data: data,
			u: (new Date()).valueOf()
		})
	})
	
	socket.on('clear', function() {
		io.emit('wipe')
		shapes = []
	})
	
	socket.on('disconnect', function() {
		console.log(' - ' + chalk.red('Disconnect') + ': ' + socket.id)
	})
})

// Logging
console.log(chalk.bold('\n\n╔════════════════════════════════════════════════╗'))
console.log('║ Chat server running on ' + chalk.yellow('http://localhost:9000') + '   ║')
console.log('║ ' + new Date() + '       ║')
console.log(chalk.bold('╚════════════════════════════════════════════════╝'))