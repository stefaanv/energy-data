import * as inquirer from 'inquirer'

export const commandRootQuestions: inquirer.QuestionCollection = {
  type: 'list',
  name: 'command',
  choices: [
    { name: 'List planned forcibles', value: 'list' },
    { name: 'Add forcible charge/discharge', value: 'add' },
    { name: 'Remove forcible', value: 'remove' },
  ],
  message: 'Pick a command',
}
