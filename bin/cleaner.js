#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const yargs = require('yargs')
const chalk = require('chalk')
const moment = require('moment')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
const params = yargs.option('date', {
  describe: 'Set date for deleting files',
  demandOption: true,
  type: 'string'
}).argv

const currentPath = process.cwd()

const parseDate = (date) => {
  const unitTypes =  ['second', 'minute', 'hour', 'day', 'week', 'month', 'year']
  let value

  if ((value = date.match(/^(\d+) ?([a-z]+)$/i))) {
    const unit = unitTypes.find(u => u === value[2] || `${u}s` === value[2])
    if (unit) {
      return {
        value: +value[1],
        unit: value[2]
      }
    } else {
      throw new Error('Unit should be an only string')
    }
  }
   else {
    throw new Error('parse error')
  }
}

const clearDirectories = file => {
  const stats = fs.lstatSync(path.join(currentPath, file))
  if (!stats.isDirectory()) {
    return file
  }
}

const filter = file => !!file

const isDateInRange = (range, fileDate) => {
  const parsedDate = parseDate(range)
  return moment(new Date()).subtract(parsedDate.value, parsedDate.unit).isAfter(fileDate)
}

const deleteFiles = (files) => {
  const KB = 1024
  const MB = KB * 1024
  const GB = MB * 1024

  let fileCounter = 0
  let size = 0

  files.map(file => {
    const filePath = path.join(currentPath, file)
    const stats = fs.statSync(filePath)

    if (isDateInRange(params.date, stats.ctime) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      size += stats.size
      console.log(chalk.red(`${file} is deleted`))
      fileCounter++
    }
  })

  if (fileCounter) {
    let displaySize
    if (size >= KB && size < MB) {
      displaySize = ((size / KB).toFixed(2)) + ' KB'
    } else if (size >= MB && size < GB) {
      displaySize = ((size / MB).toFixed(2)) + ' MB'
    } else if (size >= GB) {
      displaySize = ((size / GB).toFixed(2)) + ' GB'
    } else {
      displaySize = size.toFixed(2) + ' B'
    }

    console.log(chalk.green.inverse(`Deleted files: ${fileCounter}`))
    console.log(chalk.gray.inverse(`Size: ${displaySize}`))
  } else {
    console.log(chalk.yellow.inverse('The files didn\'t find for delete'))
  }
}

fs.readdir(currentPath,(err, files) => {
  if (err) throw err
  const onlyFiles = files.map(clearDirectories)
    .filter(filter)

  readline.question('Are really sure? (y/n): ', answer => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      deleteFiles(onlyFiles)

      readline.close()
    } else {
      readline.close()
    }
  })

})
