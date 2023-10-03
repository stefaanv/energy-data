import { QuestionSet, Question } from 'nest-commander'

@QuestionSet({ name: 'commandSequence' })
export class CommandSequenceQuestions {
  @Question({
    type: 'list',
    name: 'command',
    choices: [
      { name: 'List planned forcibles', value: 'list' },
      { name: 'Add forcible charge/discharge', value: 'add' },
      { name: 'Remove forcible', value: 'remove' },
    ],
    message: 'Pick a command',
  })
  parseName(val: string) {
    return val
  }

  // @Question({
  //   type: 'input',
  //   name: 'age',
  //   message: 'How old are you?',
  // })
  // parseAge(val: string) {
  //   return Number.parseInt(val, 10)
  // }
}
