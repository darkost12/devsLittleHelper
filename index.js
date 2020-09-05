const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');



class App  {
    constructor () {
        let [paths, files] = this.getFiles();
        this.COMMENTLIST = this.extractComments(files, paths);
        this.BUFFER = '';

        console.log('Please, write your command!');
        readLine(x => this.processCommand(x));
    }

    getFiles () {
        const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
        return [filePaths, filePaths.map(path => readFile(path))];
    }

    extractComments (files, paths) {
        const regex = /(?<=\/\/ TODO\s)(.*)/gi;
        let comments = [];

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let path = paths[i];
            let matches = file.match(regex);
            if (!matches) continue;
            for (let match of matches) {
                comments.push(this.parseStringIntoComment(
                    match, path 
                ));
            }
        }
        return comments;
    }
    parseStringIntoComment (text, filePath) {
        let components = text.split(';')
        const fields = ['user', 'date', 'comment'];
        const capacities = [10, 10, 50, 15];
        let items = {};

        if (components.length == 1) {
            items['comment'] = shorten(components[0].trim(), capacities[2]);
            items['user'] = '';
            items['date'] = '';
        } else {
            for (let [index, component] of components.entries()) {
                component = component.trim();
                if (component.length == 0) 
                    items[fields[index]] = '';
                else 
                    items[fields[index]] = 
                    shorten(component, capacities[index]);
            }
        }
        items['fileName'] = shorten(path.basename(filePath), capacities[3]);
        items['importance'] = getImportance(items['comment']);
        return items;
    }

    filterUser(comments, name) {
        return comments.filter(comment => 
            comment['user'].toLowerCase().startsWith(name.toLowerCase())
        );
	}

    filterDate (comments, date) {
        return comments.filter(comment => 
            comment['date'] > date
        );
    }

    filterImportance (comments) {
        return comments.filter(comment =>
            comment['importance'] > 0
        );
    }

    sortByField(comments, field) {
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

    print(comments) {
        const padding = '  ';
        const fields = ['!', 'user', 'date', 'comment', 'fileName'];
        let maximums = ['!'.length, 'user'.length, 'date'.length, 
            'comment'.length, 'fileName'.length];

        if (comments.length == 0) {
            this.printHeader(padding, fields, maximums);
            this.printSeparator(padding, maximums);
            process.stdout.write(this.BUFFER);
            this.BUFFER = '';
            return;
        }
        for (let i = 1; i < fields.length; i++) {
            let relativeMax = this.getMaxWidth(comments, fields[i]);
            if (relativeMax > maximums[i])
                maximums[i] = relativeMax;
        }
        this.printHeader(padding, fields, maximums);
        this.printSeparator(padding, maximums);

        fields[0] = 'importance';
        for (let comment of comments) {
            for (let [index, field] of fields.entries()){
                this.BUFFER += padding;
                if (field == 'importance') 
                    this.BUFFER += comment[field] > 0 ? '!' : ' ';
                else
                    this.BUFFER += comment[field].toString()
                        .padEnd(maximums[index],' ');
                this.BUFFER += padding;
                if (index != fields.length - 1)
                    this.BUFFER += '|';
                else 
                    this.BUFFER += '\n';
            }
        }
        this.printSeparator (padding, maximums);
        
        process.stdout.write(this.BUFFER);
        this.BUFFER = '';
    }

    getMaxWidth(comments, field) {
        return Math.max(...comments.map(x => x[field].length));
    }

    printHeader(padding, fields, maximums) {
        for (let [index, field] of fields.entries()) {
            this.BUFFER += padding;
            this.BUFFER += field.padEnd(maximums[index],' ');
            this.BUFFER += padding;
            if (index != fields.length - 1)
                this.BUFFER += '|';
            else 
                this.BUFFER += '\n';
        }
    }

    printSeparator (padding, maximums) {
        this.BUFFER += '-'.padEnd(maximums.reduce((a, b) => a + b, 0) +
            2 * 5 * padding.length +
            4 * '|'.length,'-') + 
            '\n';
    }

    processCommand (command) {
        let [operation, modifier] = command.split(' ');
        switch (operation) {
            case 'exit':
                process.exit(0);
                break;
            case 'show':
                this.print(Object.assign([], this.COMMENTLIST));
                break;
            case 'important':
                this.print(this.filterImportance(
                    Object.assign([], this.COMMENTLIST)
                ));
                break;
            case 'user':
                if (modifier === undefined) {
                    console.log('Please provide username');
                    break;
                }
                this.print(this.filterUser(
                    Object.assign([], this.COMMENTLIST), modifier
                ));
                break;
            case 'date':
                if (modifier === undefined) {
                    console.log('Please provide date');
                    break;
                }
                this.print(this.filterDate(
                    Object.assign([], this.COMMENTLIST), modifier
                ));
                break;
            case 'sort':
                if (
                    modifier === undefined || 
                    !['importance', 'date', 'user'].includes(modifier)
                ) {
                    console.log(
                        'Please provide correct key {importance|date|user}'
                    );
                    break;
                }
                let copy = Object.assign([], this.COMMENTLIST);
                this.sortByField(copy, modifier);
                this.print(copy)
                break;

            default:
                console.log('wrong command');
                break;
        }
    }
}
new App();

// TODO you can do it!

function shorten (str, lim) {
    return str.length > lim ? (str.substring(0, lim - 3) + '...') : str;
}

function getImportance (text) {
    return (text.match(/!/g) || []).length;
}