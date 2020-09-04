const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');
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
    let comments = [];
    for (let i = 0; i < files.length; i++) {
        files[i] = files[i].match(regex);
        if (!files[i]) continue;
        for (let j = 0; j < files[i].length; j++) {
            let components = files[i][j].split(';');
            let params = [];
            if (components.length == 1) {
                params['text'] = components[0].trim();
            } else {
                for (let j = 0; j < components.length; j++) {
                    components[j] = components[j].trim();
                    if (components[j].length == 0) continue;
                    params[fields[j]] = components[j];
                }
            }
            params['path'] = path.basename(paths[i]);
            comments.push(params);
        }
    }
    return comments;
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
