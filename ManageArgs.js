const { prompt } = require('./PromisifedFunctions');
const { setBaseDirectory, findOrMakeDirectory, getDirFromDirectory, stateQuestion } = require('./FileActions');
const { platforms, actions, tasks } = require('./Enums');
const path = require('path');

const selections = {
    platform: { key: undefined, id: undefined, value: undefined },
    epic: { key: undefined, id: undefined },
    task: { key: undefined, id: undefined },
    action: { key: undefined, id: undefined },
    data: []
};

const params = {
    baseDirectory: undefined,
    ...selections,
}

function generateMenuStructure() {
    return Object.keys(platforms).map((platform, idx) => {
        const menuItem = {
            id: platform,
            dirName: platforms[platform],
            1: {
                id: tasks.WORKSPACE,
                1: {
                    id: actions.CREATE
                }
            },
            2: {
                id: tasks.MARKDOWN,
                1: {
                    id: actions.ADD
                },
                2: {
                    id: actions.TRIM
                },
    
            },
            3: {
                id: tasks.PROJECTS,
                1: {
                    id: actions.ADD
                }
            }
        }
        return {[idx + 1]: menuItem };
    }).reduce((obj, menuItemObj) => {
        return {...obj, ...menuItemObj}
    }, {});
}

async function createNewDirectories(platformId) {
    const initialDirectory = await setBaseDirectory(platformId);
    await findOrMakeDirectory(initialDirectory)
}

async function getPlatform(question, structure) {
    return getGeneral(question, structure);
}

async function getEpic(question) {
    let value;
    let subValue;
    let condition;
    let getIds = {};
    const keys = [];
    const ids = [];
    const initialDirectory = await setBaseDirectory(params.platform.id);
    const directoryList = await getDirFromDirectory(initialDirectory);
    const options = directoryList.map((dir, index) => {
        keys.push(`${index + 1}`);
        ids.push(dir);
        getIds = { ...getIds, ...{ [`${index + 1}`]: dir } }
        return `${index + 1} - ${dir}`
    });
    do {
        condition = false;

        console.log('\x1b[36m%s\x1b[0m','\nIf you are adding a new directory, please type it now');
        value = await stateQuestion(question, options);
        if (!keys.includes(value)) {
            const subOptions = ["1 - yes", "2 - no"]
            subValue = + await stateQuestion('Are you creating a new directory?', subOptions);
            if (subValue != 1) {
                condition = true;
                console.log(`\nTry again, pick a number from 1 to ${keys.length}\n\n`)
            }
        }
    } while (condition);

    if (!subValue) {
        params.baseDirectory = initialDirectory.concat(getIds[value]);
    } else {
        params.baseDirectory = initialDirectory.concat(value);
    }

    return { key: value, id: getIds[value] }
}

async function getTask(question, structure) {
    return getGeneral(question, structure);
}

async function getAction(question, structure) {
    const value = await getGeneral(question, structure);
    const action = value.id;
    switch (action) {
        case actions.ADD:
            params.data.push(+ await prompt('\nPlease indicate how many files are you adding: \n'));
            break;
        case actions.TRIM:
        case actions.CREATE:
            break;
        default:
            throw 'Invalid action provided';
    }
    return value;
}

async function getGeneral(question, structure) {
    let value;
    let condition;
    const keys = [];
    const ids = [];
    const options = Object.entries(structure).map(([key, value]) => {
        keys.push(key);
        ids.push(ids);
        return `${key} - ${value.id}`
    }).filter((elem) => !elem.includes("undefined"));
    do {
        condition = false;
        value = await stateQuestion(question, options);
        if (!keys.includes(value)) {
            condition = true;
            console.log(`\nTry again, pick a number from 1 to ${keys.length}\n\n`)
        }
    } while (condition);

    return { key: value, id: structure[value].id, dirName: structure[value].dirName }
}

async function getParams() {
    const menuStructure = generateMenuStructure();
    params.platform = await getPlatform('Please provide platform number', menuStructure);
    await createNewDirectories(params.platform.id);
    params.epic = await getEpic('Please provide epic number');
    params.task = await getTask('Please provide task number', menuStructure[params.platform.key]);
    params.action = await getAction('Please provide action number', menuStructure[params.platform.key][params.task.key]);
    return params;
}

exports.getParams = getParams;