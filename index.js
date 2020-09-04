const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const path = require('path');



class App  {
    constructor () {
        let [paths, files] = this.getFiles();
        this.COMMENTLIST = this.extractComments(paths, files);
        this.BUFFER = '';
        console.log('Please, write your command!');
        readLine(x => this.processCommand(x));
    }

    getFiles () {
        const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
        return [filePaths, filePaths.map(path => readFile(path))];
    }

    extractComments (paths, files) {
        const regex = /(?<=\/\/ TODO\s)(.*)/gi;
        let comments = [];
        for (let i in files) {
            files[i] = files[i].match(regex);
            if (!files[i]) continue;
            for (let j in files[i]) {
                let components = files[i][j].split(';');
                comments.push(this.parseComponents(
                    paths[i], components
                ));
            }
        }
        return comments;
    }
    parseComponents (filePath, components) {
        const fields = ['user', 'date', 'comment'];
        const capacities = [10, 10, 50, 15];
        let items = {};
        if (components.length == 1) {
            items['comment'] = shorten(components[0].trim(), capacities[2]);
            items['user'] = '';
            items['date'] = '';
        } else {
            for (let j in components) {
                components[j] = components[j].trim();
                if (components[j].length == 0) 
                    items[fields[j]] = '';
                else 
                    items[fields[j]] = shorten(components[j], capacities[j]);
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
            comment['importance'] > 0)
       
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
        for (let i in comments) {
            for (let j in fields){
                this.BUFFER += padding;
                if (fields[j] == 'importance') 
                    this.BUFFER += comments[i][fields[j]] > 0 ? '!' : ' ';
                else
                    this.BUFFER += comments[i][fields[j]].toString()
                        .padEnd(maximums[j],' ');
                this.BUFFER += padding;
                if (j != fields.length - 1)
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
        for (let i in fields) {
            this.BUFFER += padding;
            this.BUFFER += fields[i].padEnd(maximums[i],' ');
            this.BUFFER += padding;
            if (i != fields.length - 1)
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
                    console.log('Please provide correct key');
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