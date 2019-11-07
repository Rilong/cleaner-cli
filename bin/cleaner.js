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
  let value;

  if ((value = date.match(/^(\d+) ?(days?)$/))) {
    return {
      value: +value[1],
      unit: value[2]
    }
  } else if ((value = date.match(/^(\d+) ?(months?)$/))) {
    return {
      value: +value[1],
      unit: value[2]
    }
  } else if ((value = date.match(/^(\d+) ?(years?)$/))) {
    return {
      value: +value[1],
      unit: value[2]
    }
  } else {
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
  let fileCounter = 0

  files.map(file => {
    const filePath = path.join(currentPath, file)
    const stats = fs.statSync(filePath)

    if (isDateInRange(params.date, stats.ctime) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(chalk.red(`${file} is deleted`))
      fileCounter++
    }
  })

  if (fileCounter) {
    console.log(chalk.green.inverse(`Deleted files: ${fileCounter}`))
  } else {
    console.log(chalk.yellow.inverse('The files didn\'t find for delete'))
  }
}

fs.readdir(currentPath,(err, files) => {
  if (err) throw err
  const onlyFiles = files.map(clearDirectories)
    .filter(filter)

  readline.question('Are really sure? (y/n): ', answer => {
    if (answer === 'y') {
      deleteFiles(onlyFiles)

      readline.close()
    } else {
      readline.close()
    }
  })

})
