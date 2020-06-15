const Diagnostics = require('Diagnostics')
const Patches = require('Patches')
const Reactive = require('Reactive')
const Scene = require('Scene')
const Time = require('Time')



const log = (message) => Diagnostics.log(message)

const setTimeout = (func, timeout) => Time.setTimeout(func, timeout)

const findMe = (identifier) => Scene.root.findFirst(identifier, null)

const subscribeToPatchPulse = (identifier, func) => {
    return Patches.outputs.getPulse(identifier).then(pulse => pulse.subscribe(func))
}

const subscribeToPatchScalar = (identifier, func) => {
    return Patches.outputs.getScalar(identifier).then(scalarSignal => scalarSignal.monitor({fireOnInitialValue: true}).subscribe(func))
}

const sendBooleanToPatch = (identifier, value) => Patches.inputs.setBoolean(identifier, !!value)

const sendScalarToPatch = (identifier, value) => Patches.inputs.setScalar(identifier, +value)

const sendPulseToPatch = (identifier) => Patches.inputs.setPulse(identifier, Reactive.once())



// common properties
const initialSpeed = 100
const maxSpeed = 30

let playing = false
let speedMultiplier = 0
let speedStep = 9
let level = 0
let currentItemValue = 0
let itemsCount = 0
let score = 0



const sendDoPlay = (value) => sendBooleanToPatch('doPlay', !!value)
const sendResetAnimation = () => sendPulseToPatch('resetAnimation')
const sendMultiplier = (value) => sendScalarToPatch('speedMultiplier', +value)
const sendLevelUp = () => sendPulseToPatch('levelUp')
const setScoreText = (txt) => findMe('txt-score').then(obj => obj.text = txt.toString())
const setScoreAddedText = (txt) => findMe('txt-score-added').then(obj => obj.text = `+${txt}`)
const clearScoreAddedText = () => findMe('txt-score-added').then(obj => obj.text = '')

const setMultiplier = (value) => {
    speedMultiplier = value
    sendMultiplier(value)
}

const setScore = (value) => {
    score = value
    setScoreText(score.toString())
}

const increaseItemsCount = () => {
    itemsCount++
    if (itemsCount % 4 === 0) {
        // log(`level up`)
        level++
        setMultiplier(speedMultiplier - speedStep)
        sendLevelUp()
    }
}

subscribeToPatchPulse('tapped', () => {
    // log(`tapped`)
    if (!playing) {
        sendResetAnimation()
        setMultiplier(initialSpeed)
        playing = true
        level = 0
        itemsCount = 0
        setScore(0)
        sendDoPlay(true)
    }
})

subscribeToPatchPulse('droppedGood', () => {
    // log(`good drop, value: ${currentItemValue}`)
    setScore(score + currentItemValue)
    if (currentItemValue > 0) {
        setScoreAddedText(currentItemValue)
        setTimeout(() => { clearScoreAddedText() }, 1500)
    }
    increaseItemsCount()
})

subscribeToPatchPulse('droppedBad', () => {
    // log(`bad drop, value: ${currentItemValue}`)
    sendDoPlay(false)
    playing = false
    sendResetAnimation()
    setMultiplier(initialSpeed)
})

subscribeToPatchScalar('currentItemValue', (options) => {
    // log(`new value: ${currentItemValue}`)
    currentItemValue = options.newValue
})

// init
sendDoPlay(false)
sendResetAnimation()
sendMultiplier(initialSpeed)