'use babel';

/**
 * Note that this can't be loaded lazily as `atom` doesn't export it correctly
 * for that, however as this comes from app.asar it is pre-compiled and is
 * essentially "free" as there is no expensive compilation step.
 */
// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import path from 'path';

const lazyReq = require('lazy-req')(require);

const { delimiter, dirname } = lazyReq('path')('delimiter', 'dirname');
const { exec, generateRange } = lazyReq('atom-linter')('exec', 'generateRange');
const os = lazyReq('os');

const getProjectDir = (filePath) => {
  const atomProject = atom.project.relativizePath(filePath)[0];
  if (atomProject === null) {
    // Default project to file directory if project path cannot be determined
    return dirname(filePath);
  }
  return atomProject;
};

const fixPathString = (pathString, fileDir, projectDir) => {
  const string = pathString;
  const fRstring = string.replace(/%f/g, fileDir);
  const hRstring = fRstring.replace(/%h/g, path.basename(projectDir));
  const pRstring = hRstring.replace(/%p/g, projectDir);
  return pRstring;
};

export default {
  activate() {
    require('atom-package-deps').install('linter-prospector');

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.config.observe('linter-prospector.executablePath', (value) => {
      this.executablePath = value;
    }));
    this.subscriptions.add(atom.config.observe('linter-prospector.profile', (value) => {
      this.profile = value;
    }));
    this.subscriptions.add(atom.config.observe('linter-prospector.pythonPath', (value) => {
      this.pythonPath = value;
    }));
    this.subscriptions.add(atom.config.observe('linter-prospector.workingDirectory', (value) => {
      this.workingDirectory = value.replace(delimiter, '');
    }));
    this.subscriptions.add(atom.config.observe('linter-prospector.userArgs', (value) => {
      this.userArgs = value;
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'Prospector',
      scope: 'file',
      lintsOnChange: false,
      grammarScopes: ['source.python', 'source.python.django'],
      lint: async (editor) => {
        const filePath = editor.getPath();
        const fileDir = dirname(filePath);
        const fileText = editor.getText();
        const projectDir = getProjectDir(filePath);
        const cwd = fixPathString(this.workingDirectory, fileDir, projectDir);
        const execPath = fixPathString(this.executablePath, '', projectDir);
        const env = Object.create(process.env, {
          PYTHONPATH: {
            value: [
              process.env.PYTHONPATH,
              fixPathString(this.pythonPath, fileDir, projectDir),
            ].filter(x => !!x).join(delimiter),
            enumerable: true,
          },
          LANG: { value: 'en_US.UTF-8', enumerable: true },
        });
        const args = [
          '--messages-only',
          '--output-format=json',
        ];
        if (this.profile !== '') {
          args.push(`--profile-path=${fixPathString(this.profile, fileDir, projectDir)}`);
        }
        if (this.userArgs !== '') {
          this.userArgs.split(' ').forEach((arg) => {
            args.push(arg)
          });
        }
        args.push(filePath);

        const execOpts = { env, cwd, stream: 'both' };

        const data = await exec(this.executablePath, args, execOpts);

        const toReturn = [];
        JSON.parse(data.stdout).messages.forEach((message) => {
          let position;
          // Prospector line numbers are off by 1
          try {
            position = generateRange(editor, message.location.line - 1, message.location.character);
          }
          catch(error) {
            position = generateRange(editor, message.location.line - 1, 0);
          }

          toReturn.push({
            excerpt: message.code + ': ' + message.message,
            location: { file: filePath, position },
            severity: 'warning',
          });
        });

        if (editor.getText() !== fileText) {
          // Editor text was modified since the lint was triggered, tell Linter not to update
          return null;
        }

        return toReturn;
      },
    };
  },
};
