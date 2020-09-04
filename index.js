const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');


let COMMENTLIST = [];
let BUFFER = '';
app();

function app () {
    let [paths, files] = getFiles();
    COMMENTLIST = extractComments(paths, files);

    console.log('Please, write your command!');
    readLine(processCommand);
}

function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return [filePaths, filePaths.map(path => readFile(path))];
}

function extractComments (paths, files) {
    const regex = /(?<=\/\/ TODO\s)(.*)/gi;
    const fields = ['user', 'date', 'comment'];
    const capacities = [10, 10, 50, 15];
    let comments = [];
    for (let i = 0; i < files.length; i++) {
        files[i] = files[i].match(regex);
        if (!files[i]) continue;
        for (let j = 0; j < files[i].length; j++) {
            let components = files[i][j].split(';');
            let items = {};
            if (components.length == 1) {
                items['comment'] = shorten(components[0].trim(), capacities[2]);
                items['user'] = '';
                items['date'] = '';
            } else {
                for (let j = 0; j < components.length; j++) {
                    components[j] = components[j].trim();
                    if (components[j].length == 0) 
                        items[fields[j]] = '';
                    else 
                        items[fields[j]] = shorten(components[j], capacities[j]);
                }
            }
            items['fileName'] = shorten(path.basename(paths[i]), capacities[3]);
            items['importance'] = getImportance(items['comment']);
            comments.push(items);
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

function filterUser (comments, name) {
    newComments = [];
    for (let i = 0; i < comments.length; i++) {
        if (comments[i]['user'].toLowerCase().startsWith(name.toLowerCase()))
            newComments.push(comments[i])
    }
    return newComments;
}

function filterDate (comments, date) {
    newComments = [];
    for (let i = 0; i < comments.length; i++) {
        if (comments[i]['date'] > date)
            newComments.push(comments[i])
    }
    return newComments;
}

function filterImportance (comments) {
    newComments = [];
    for (let i = 0; i < comments.length; i++) {
        if (comments[i]['importance'] > 0)
            newComments.push(comments[i]);
    }
    return newComments;
}

function sortByField(comments, field) {
    if (field == 'user') {
        comments.sort((a, b) => 
            !a['user'] ? 1 : (
                !b['user'] ? -1 : (
                    a['user'].localeCompare(b['user'])
                )
            )
        );
    } else {
        comments.sort((a, b) => a[field] <= b[field] ? 1 : -1);
    }
}
function print(comments) {
    const padding = '  ';
    const fields = ['!', 'user', 'date', 'comment', 'fileName'];
    let maximums = ['!'.length, 'user'.length, 'date'.length, 
        'comment'.length, 'fileName'.length];
    if (comments.length == 0) {
        printHeader(padding, fields, maximums);
        printSeparator(padding, maximums);
        process.stdout.write(BUFFER);
        BUFFER = '';
        return;
    }
    for (let i = 1; i < fields.length; i++) {
        relativeMax = getMaxWidth(comments, fields[i]);
        if (relativeMax > maximums[i])
            maximums[i] = relativeMax;
    }
    printHeader(padding, fields, maximums);
    printSeparator(padding, maximums);
    fields[0] = 'importance';
    for (let i = 0; i < comments.length; i++) {
        for (let j = 0; j < fields.length; j++){
            BUFFER += padding;
            if (fields[j] == 'importance') 
                BUFFER += comments[i][fields[j]] > 0 ? '!' : ' ';
            else
                BUFFER += comments[i][fields[j]].toString().padEnd(maximums[j],' ');
            BUFFER += padding;
            if (j != fields.length - 1)
                BUFFER += '|';
            else 
                BUFFER += '\n';
        }
    }
    printSeparator (padding, maximums);
    process.stdout.write(BUFFER);
    BUFFER = '';
}

function getMaxWidth(comments, field) {
    return Math.max(...comments.map(x => x[field].length));
}

function printHeader(padding, fields, maximums) {
    for (let i = 0; i < fields.length; i++) {
        BUFFER += padding;
        BUFFER += fields[i].padEnd(maximums[i],' ');
        BUFFER += padding;
        if (i != fields.length - 1)
            BUFFER += '|';
        else 
            BUFFER += '\n';
    }
}

function printSeparator (padding, maximums) {
    BUFFER += '-'.padEnd(maximums.reduce((a, b) => a + b, 0) +
        2 * 5 * padding.length +
        4 * '|'.length,'-') + 
        '\n';
}

function processCommand (command) {
    let [operation, modifier] = command.split(' ');
    switch (operation) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            print(Object.assign([], COMMENTLIST));
            break;
        case 'important':
            print(filterImportance(Object.assign([], COMMENTLIST)));
            break;
        case 'user':
            if (modifier === undefined) {
                console.log('Please provide username');
                break;
            }
            print(filterUser(Object.assign([], COMMENTLIST), modifier));
            break;
        case 'date':
            if (modifier === undefined) {
                console.log('Please provide date');
                break;
            }
            print(filterDate(Object.assign([], COMMENTLIST), modifier));
            break;
        case 'sort':
            if (
                modifier === undefined || 
                !['importance', 'date', 'user'].includes(modifier)
            ) {
                console.log('Please provide correct key');
                break;
            }
            let copy = Object.assign([], COMMENTLIST);
            sortByField(copy, modifier);
            print(copy)
            break;

        default:
            console.log('wrong command');
            break;
    }
}

// TODO you can do it!
