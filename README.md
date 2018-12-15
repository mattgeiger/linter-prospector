# linter-prospector
This package will lint your opened Python-files in Atom, using [Prospector](https://prospector.landscape.io/en/master/#).

## Installation

* Install [prospector](https://prospector.landscape.io/en/master/#installation).
* `$ apm install linter-prospector`

## Configuration
* **Executable** Path to your pylint executable. This is useful if you have different versions of pylint for Python 2
  and 3 or if you are using a virtualenv. Use `%p` for the current project (no trailing /).
* **Python Path** Paths to be added to the `PYTHONPATH` environment variable. Use `%p` for the current project
  directory (e.g. `%p/vendor`) or `%f` for the directory of the current
  file location.
* **Profile** Path to .prospector.yaml file. Use `%p` for the current project directory or `%f` for the directory of the current
  file location.
* **Working Directory** Directory pylint is run from. Use `%p` for the current project directory or `%f` for the
  directory of the current file.
  `%p` will fallback to the current file's directory (equivilent to `%f`) if no project directory can be determined.
* **Prospector Arguments** Extra arguments for prospector, separated with a space.

## Other available linters
There are other linters available - take a look at the linters [mainpage](https://github.com/steelbrain/linter).
