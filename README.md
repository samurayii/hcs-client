# HCS Client

## Информация

Клиент для [сервера конфигурации](https://github.com/samurayii/http-config-server).

## Оглавление

- [Установка](#install)
- [Ключи запуска](#launch)

## <a name="install"></a> Установка и использование

пример установки: `npm install hcs-client -g`

вызов справки: `hcs-client -h`

пример запуска: `hcs-client -u http://localhost:3001/api/ -l debug -i 5 -k ./tests/keys/keys1.json ./tests/keys/keys2.toml -t /git1/config.json:tmp/config.json /git1/app2:tmp/app2`

пример запуска с приложением: `hcs-client -u http://localhost:3001/api/ -e "node ./app.js" -up -l debug -i 5 -k ./tests/keys/keys1.json ./tests/keys/keys2.toml -t /git1/config.json:tmp/config.json /git1/app2:tmp/app2`

## <a name="launch"></a> Таблица ключей запуска

Ключ | Переменая среды | Описание
------------ | ------------- | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
-u, --url | HCS_CLIENT_URL | ссылка на сервер конфигурации (пример: http://config-server:5000/api )
-e, --exec | HCS_CLIENT_EXEC | строка запуска приложения
-w, --webhook | HCS_CLIENT_WEBHOOK | ссылка на webhook (если не указан, то используется сигнал **SIGTERM**, необходим ключ **exec**)
-i, --interval | HCS_CLIENT_INTERVAL | интервал проверки обновлений (необходим ключ exec)
-ri, --restart_interval | HCS_CLIENT_RESTART_INTERVAL | интервал перезагрузки приложения (необходим ключ **exec**)
-t, --target | HCS_CLIENT_TARGET | массив файлов/папок для синхронизации (формат: <ссылка на сервере>:<ссылка назначения>)
-c, --cwd | HCS_CLIENT_CWD | рабочая папка для приложения (необходим ключ **exec**)
-up, --update | HCS_CLIENT_UPDATE | слежка за изменениями файлов  (необходим ключ **exec**)
-cr, --critical | HCS_CLIENT_CRITICAL | флаг критического процесса, он не запуститься если не прошла первичная синхронизация (необходим ключ **exec**)
-l, --logs | HCS_CLIENT_LOGS | уровень логов **prod**, **dev** или **debug** (по умолчанию prod)
-k, --keys | HCS_CLIENT_KEYS | массив файлов ключей в формате json или toml. Переменые клиента имеют префикс **client.**
