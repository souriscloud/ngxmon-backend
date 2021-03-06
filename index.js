const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors('*'))

const parsetime = timelocal => {
  const timezoneSplit = timelocal.split(' ');
  const timezone = timezoneSplit[1]

  const hoursDateSplit = timezoneSplit[0].split(':')
  const dateToFormat = hoursDateSplit[0]
  const hours = hoursDateSplit[1]
  const minutes = hoursDateSplit[2]
  const seconds = hoursDateSplit[3]

  const dateSplit = dateToFormat.split('/')
  const day = dateSplit[0]
  const monthStr = dateSplit[1]
  const year = dateSplit[2]
  const month = new Date(monthStr+'-1-01').getMonth() + 1

  return new Date(year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds)
}

const parseLine = line => {
  const rx = /[\"|\["].+?[\"|\]"]|[^ ]+/g
  const arr = []
  let m
  while (m = rx.exec(line)) {
    arr.push(m[0])
  }
  
  if (arr.length !== 9) {
    console.warn('Parsed config line doesn\'t contain 10 elements!');
    return null
  }

  /**
   * 
   * @param {string} str 
   */
  const stripsub = str => str.substring(1, str.length - 1)

  const timeLocal = stripsub(arr[3])

  return {
    remoteAddress: arr[0],
    remoteUser: arr[2] === '-' ? null : arr[2],
    timeLocal,
    dateTime: parsetime(timeLocal),
    request: stripsub(arr[4]),
    status: arr[5],
    bodyBytesSent: arr[6],
    httpReferer: stripsub(arr[7]),
    httpUserAgent: stripsub(arr[8]),
  }
}

app.get('/', (req, res) => {
  res.send({
    status: 'ok'
  })
})

app.get('/synco', (req, res) => {
  let access = process.env.SYNCO_ACCESS_PATH
  if (process.env.APP_DEBUG) {
    access = path.join(__dirname, 'test_data', 'synco.access.log')
  }
  fs.readFile(access, 'utf-8', (err, data) => {
    if (err) {
      console.error(err)
      res.status(500).send({
        status: 'error',
        error: err
      })
    }

    const lines = data.split("\n")
    lines.pop()
    const linesData = lines.map(parseLine).reverse()

    res.send({
      status: 'ok',
      data: linesData
    })
  })
})

app.listen(8484, () => console.log('Listening on port 8484'))