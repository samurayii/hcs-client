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

Ключ | Описание
------------ | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
-u, --url | ссылка на сервер конфигурации (пример: http://config-server:5000/api )
-e, --exec | строка запуска приложения
-w, --webhook | ссылка на webhook (если не указан, то используется сигнал **SIGTERM**, необходим ключ **exec**)
-i, --interval | интервал проверки обновлений (необходим ключ exec)
-ri, --restart_interval | интервал перезагрузки приложения (необходим ключ **exec**)
-t, --target | массив файлов/папок для синхронизации (формат: <ссылка на сервере>:<ссылка назначения>)
-c, --cwd | рабочая папка для приложения (необходим ключ **exec**)
-up, --update | вызвать справку по ключам запуска (необходим ключ **exec**)
-l, --logs | уровень логов **prod**, **dev** или **debug** (по умолчанию prod)
-k, --keys | массив файлов ключей