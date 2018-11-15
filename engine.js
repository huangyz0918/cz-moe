'format cjs';

var wrap = require('word-wrap');
var map = require('lodash.map');
const EmojiCharString = require('emojicharstring');

const blanks = n =>
  Array(n)
    .fill(' ')
    .join('');
const strLength = s => new EmojiCharString(s).length;
const longestLength = xs => Math.max(...xs.map(strLength));
const rightPad = (s, length) => s + blanks(length - strLength(s));

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = function(options) {
  var types = options.types;

  var length = longestLength(Object.keys(types)) + 1;
  var choices = map(types, function(type, key) {
    return {
      name: rightPad(key + ':', length) + ' ' + type.description,
      value: key
    };
  });

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter: function(cz, commit) {
      console.log(
        '\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n'
      );

      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      // collection library if you prefer.
      cz
        .prompt([
          {
            type: 'list',
            name: 'type',
            message: "Select the type of change that you're committing:",
            choices: choices
          },
          {
            type: 'input',
            name: 'scope',
            message:
              'What is the scope of this change (e.g. component or file name)? (press enter to skip)\n'
          },
          {
            type: 'input',
            name: 'subject',
            message:
              'Write a short, imperative tense description of the change:\n'
          },
          {
            type: 'input',
            name: 'body',
            message:
              'Provide a longer description of the change: (press enter to skip)\n'
          },
          {
            type: 'confirm',
            name: 'isBreaking',
            message: 'Are there any breaking changes?',
            default: false
          },
          {
            type: 'input',
            name: 'breaking',
            message: 'Describe the breaking changes:\n',
            when: function(answers) {
              return answers.isBreaking;
            }
          },
          {
            type: 'confirm',
            name: 'isIssueAffected',
            message: 'Does this change affect any open issues?',
            default: false
          },
          {
            type: 'input',
            name: 'issues',
            message: 'Add issue references (e.g. "fix #123", "re #123".):\n',
            when: function(answers) {
              return answers.isIssueAffected;
            }
          }
        ])
        .then(function(answers) {
          var maxLineWidth = 100;

          var wrapOptions = {
            trim: true,
            newline: '\n',
            indent: '',
            width: maxLineWidth
          };

          // parentheses are only needed when a scope is present
          var scope = answers.scope.trim();
          scope = scope ? '(' + answers.scope.trim() + ')' : '';

          // Hard limit this line
          var head = (
            answers.type +
            scope +
            ': ' +
            answers.subject.trim()
          ).slice(0, maxLineWidth);

          // Wrap these lines at 100 characters
          var body = wrap(answers.body, wrapOptions);

          // Apply breaking change prefix, removing it if already present
          var breaking = answers.breaking ? answers.breaking.trim() : '';
          breaking = breaking
            ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '')
            : '';
          breaking = wrap(breaking, wrapOptions);

          var issues = answers.issues ? wrap(answers.issues, wrapOptions) : '';

          var footer = [breaking, issues].filter(x => Boolean(x)).join('\n\n');

          commit(head + '\n\n' + body + '\n\n' + footer);
        });
    }
  };
};
