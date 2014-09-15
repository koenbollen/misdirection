#!/usr/bin/env node
// misdirection.js

var _ = require('lodash');
var readline = require('readline');

var program = require('commander');
program
  .version('0.0.1')
  .description('misdirection utilities')
  .usage('[global options] <command> [command-options] [command-arguments]')

  .option('-v, --verbose', 'more (debug) output')
  .option('-q, --quiet', 'suppress all non-error output')
  //.option('-r, --redis', 'redis connect uri'); // TODO: implement
  ;

process.env.NODE_ENV = 'cli';
var app = require('../app');
var directions = require('../lib/directions');


function formatInfo(info) {
  return info.id+': '+info.name+' => '+info.url+' ('+info.type+')';
}

program
  .command('list [prefix]')
  .description('list all directions')
  .action(function(prefix, options) {
    directions.list(prefix||'', function(err, list) {
      if(err) {
        console.log('failed to load:', err.message);
        process.exit(1);
      }
      if(!program.quiet) {
        list.forEach(function(info) {
          console.log(formatInfo(info));
        });
      }
      process.exit(0);
    });
  });

program
  .command('create <name> <url> [type]')
  .description('create a directions')
  .option('-t, --title text', 'give a frame or largetype a title')
  .action(function(name, url, type, options) {

    var info = {
      url: url,
      type: type || 'redirect'
    };

    if(options.title) {
      info.title = options.title;
    }
    // Left here, title does not work, try:
    // ./bin/misdirection.js create /title Koen largetype -t TestTitle
    directions.create(name, info, function(err, info, results) {
      if(err) {
        console.error('failed to create '+name+': '+err.message);
        process.exit(1);
      }
      if(!program.quiet) {
        console.log('direction created:', formatInfo(info));
      }
      process.exit(0);
    });
  });

program
  .command('rm name')
  .alias('remove')
  .description('remove an direction')
  .option('-f, --force', 'don\'t confirm deletion')
  .action(function(name, options) {
    directions.find(name, function(err, info) {
      if(err) {
        console.error('failed to find '+name+': '+err.message);
        process.exit(1);
      }
      if(!info) {
        if(!program.quiet) {
          console.error('error: no such direction: '+name);
        }
        process.exit(2);
      }
      var confirmedAction = function() {
        directions.remove(info.id, function(err) {
          if(err) {
            console.error('failed to remove '+name+': '+err.message);
            process.exit(3);
          }
          if(!program.quiet) {
            console.log(info.name, 'successfully removed');
          }
          process.exit(0);
        });
      };
      if(options.force) {
        confirmedAction();
      } else {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('Are you sure to remove `'+info.name+'\'? [yN] ', function(answer) {
          if(answer.trim().toLowerCase() != 'y') {
            process.exit(0);
          } else {
            confirmedAction();
          }
        });
      }
    });
  });

program.parse(process.argv);


