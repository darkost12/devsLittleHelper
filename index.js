const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');
const arraySort = require('array-sort');


app();

function app () {
    let [paths, files] = getFiles();
    let comments = extractComments(paths, files);
    console.log('Please, write your command!');

    readLine(processCommand);

}

function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return [filePaths, filePaths.map(path => readFile(path))];
}

function extractComments (paths, files) {
    const regex = /(?<=\/\/ TODO\s)(.*)/gi;
    const fields = ['author', 'date', 'text'];
    const capacities = [10, 10, 50, 15];
    let comments = [];
    for (let i = 0; i < files.length; i++) {
        files[i] = files[i].match(regex);
        if (!files[i]) continue;
        for (let j = 0; j < files[i].length; j++) {
            let components = files[i][j].split(';');
            let params = {};
            if (components.length == 1) {
                params['text'] = shorten(components[0].trim(), capacities[2]);
            } else {
                for (let j = 0; j < components.length; j++) {
                    components[j] = components[j].trim();
                    if (components[j].length == 0) continue;
                    params[fields[j]] = shorten(components[j], capacities[j]);
                }
            }
            params['path'] = shorten(path.basename(paths[i]), capacities[3]);
            params['priority'] = getImportance(params['text']);
            comments.push(params);
        }
    }
    return comments;
}

function shorten (str, lim) {
        return str.length > lim ? (str.substring(0, lim - 3) + '...') : str;
}

function getImportance (text) {
    return (text.match(/!/g) || []).length;
}
function processCommand (command) {
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            console.log('etr');
            break;
        default:
            console.log('wrong command');
            break;
    }
}

// TODO you can do it!
