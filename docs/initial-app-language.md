# Initial App Language

On a fresh installation, DuelWords reads the device or browser's primary
preferred language. English, Spanish, Catalan, French, and German are supported;
any other primary language falls back to English. Regional variants such as
`es-ES`, `ca_ES`, and `fr-CA` use their matching language.

The first result initializes both the interface and game-language preferences
and is stored locally. From then on, explicit choices in Settings or Game
settings win and are not replaced when the device language changes. Interface
and game language remain independent after initialization.

This product Adapter follows the shared
[Apps AV Initial App Language contract](https://github.com/miguelavalos/apps-av/blob/main/docs/initial-app-language.md).
