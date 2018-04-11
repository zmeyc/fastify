'use strict'

function hookRunner (functions, runner, state, cb) {
  var i = 0

  function next (err) {
    if (err || i === functions.length) {
      cb(err, state)
      return
    }

    var _next = once(next)
    var result = runner(functions[i++], state, _next)
    if (result && typeof result.then === 'function') {
      result.then(() => _next(), handleReject)
    }
  }

  function handleReject (err) {
    cb(err, state)
  }

  next()
}

function onSendHookRunner (functions, reply, payload, cb) {
  var i = 0

  function next (err, newPayload) {
    if (err) {
      cb(err, reply, payload)
      return
    }

    if (newPayload !== undefined) {
      payload = newPayload
    }

    if (i === functions.length) {
      cb(null, reply, payload)
      return
    }

    var _next = onceSend(next)
    var result = functions[i++](reply.request, reply, payload, _next)
    if (result && typeof result.then === 'function') {
      result.then(newPayload => _next(null, newPayload), handleReject)
    }
  }

  function handleReject (err) {
    cb(err, reply, payload)
  }

  next()
}

function once (fn) {
  var called = false
  return function _next (err) {
    if (called === false) {
      called = true
      fn(err)
    }
  }
}

function onceSend (fn) {
  var called = false
  return function _next (err, payload) {
    if (called === false) {
      called = true
      fn(err, payload)
    }
  }
}

module.exports = { hookRunner, onSendHookRunner }
module.exports[Symbol.for('internals')] = { once, onceSend }
