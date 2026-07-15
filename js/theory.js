/**
 * Theory sections - unlocks together with completed levels
 * Each theory entry corresponds to a level's topic
 */
export const THEORY = [
  {
    id: 1,
    levelId: 1,
    title: 'Sequence: Базовые последовательности',
    type: 'sequence',
    icon: '📋',
    unlockCondition: 'level_1_puzzle',
    sections: [
      {
        title: 'Что такое Sequence Diagram',
        content: 'Sequence Diagram (диаграмма последовательности) показывает взаимодействие объектов во времени. Вертикальные линии — это линии жизни (lifelines), горизонтальные стрелки — сообщения между объектами.'
      },
      {
        title: 'Базовый синтаксис',
        content: '```plantuml\n@startuml\nAlice -> Bob: Привет\nBob --> Alice: Привет!\n@enduml\n```\n\n- `->` — синхронный вызов (сплошная стрелка)\n- `-->` — асинхронный/возврат (пунктирная стрелка)\n- `->>` и `-->>` — аналоги с закрашенной головкой'
      },
      {
        title: 'Участники (participants)',
        content: '```plantuml\n@startuml\nactor User\nparticipant Server\ndatabase DB\nUser -> Server: Запрос\nServer -> DB: SQL\n@enduml\n```\n\n- `actor` — человек/актер (фигурка)\n- `participant` — компонент (прямоугольник)\n- `database` — база данных (цилиндр)\n- `entity` — сущность (ромб)\n- `boundary`, `control`, `entity` — стереотипы boundary/control/entity'
      },
      {
        title: 'Группировка и заметки',
        content: '```plantuml\n@startuml\nAlice -> Bob: Запрос\nnote right of Bob: Обработка\nBob --> Alice: Ответ\n@enduml\n```\n\n- `note left/right of` — заметка слева/справа\n- `box "Group" #color` — группировка участников в рамку'
      }
    ]
  },
  {
    id: 2,
    levelId: 2,
    title: 'Sequence: Условия и циклы',
    type: 'sequence',
    icon: '🔄',
    unlockCondition: 'level_2_puzzle',
    sections: [
      {
        title: 'Условные блоки (alt/else)',
        content: '```plantuml\n@startuml\nAlice -> Bob: Запрос\nalt Успех\n  Bob --> Alice: OK\nelse Ошибка\n  Bob --> Alice: Error\nend\n@enduml\n```\n\n- `alt` / `else` / `end` — если/иначе\n- `opt` — опциональный блок (только if)\n- `loop` — цикл\n- `par` — параллельные потоки'
      },
      {
        title: 'Циклы (loop)',
        content: '```plantuml\n@startuml\nloop Для каждого элемента\n  Client -> Server: Обработать\nend\n@enduml\n```\n\n- `loop Название` — повторяющийся блок\n- Можно вкладывать циклы и условия друг в друга'
      },
      {
        title: 'Параллелизм (par)',
        content: '```plantuml\n@startuml\npar Параллельная обработка\n  Client -> ServiceA: Задача 1\nand\n  Client -> ServiceB: Задача 2\nend\n@enduml\n```\n\n- `par` / `and` / `end` — параллельные пути\n- Стрелки в разных блоках `and` выполняются параллельно'
      }
    ]
  },
  {
    id: 3,
    levelId: 3,
    title: 'Class: Классы и атрибуты',
    type: 'class',
    icon: '📦',
    unlockCondition: 'level_3_puzzle',
    sections: [
      {
        title: 'Class Diagram — основы',
        content: 'Class Diagram (диаграмма классов) показывает статическую структуру: классы, атрибуты, методы и связи между ними.'
      },
      {
        title: 'Объявление класса',
        content: '```plantuml\n@startuml\nclass User {\n  +id: Long\n  +name: String\n  -password: String\n  +login()\n  +logout()\n  #validate()\n}\n@enduml\n```\n\nВидимость:\n- `+` — public\n- `-` — private\n- `#` — protected\n- `~` — package-private\n\nСтатические: `{static} +count: int`\nАбстрактные: `{abstract} +save()`'
      },
      {
        title: 'Связи между классами',
        content: '```plantuml\n@startuml\nClass01 <|-- Class02 : Наследование\nClass03 *-- Class04 : Композиция\nClass05 o-- Class06 : Агрегация\nClass07 --> Class08 : Ассоциация\nClass09 ..> Class10 : Зависимость\n@enduml\n```\n\n- `<|--` — наследование (extends)\n- `*--` — композиция (сильная собственность)\n- `o--` — агрегация (слабая собственность)\n- `-->` — ассоциация\n- `..>` — зависимость'
      }
    ]
  },
  {
    id: 4,
    levelId: 4,
    title: 'Use Case: Актеры и прецеденты',
    type: 'usecase',
    icon: '👤',
    unlockCondition: 'level_4_puzzle',
    sections: [
      {
        title: 'Use Case Diagram — назначение',
        content: 'Показывает функциональные требования: актеры (актеры) и прецеденты вариантов использования (use cases), которые они выполняют.'
      },
      {
        title: 'Актеры и прецеденты',
        content: '```plantuml\n@startuml\nactor User\nactor Admin\nusecase "Войти в систему" as UC1\nusecase "Управлять пользователями" as UC2\nUser --> UC1\nAdmin --> UC1\nAdmin --> UC2\n@enduml\n```\n\n- `actor` / `:Actor:` — актер\n- `usecase` / `(Use Case)` — прецедент\n- `-->` — ассоциация (участие)'
      },
      {
        title: 'Отношения между прецедентами',
        content: '```plantuml\n@startuml\nusecase "Войти" as UC1\nusecase "Войти через Google" as UC2\nusecase "Войти через Email" as UC3\nUC2 ..> UC1 : <<extends>>\nUC3 ..> UC1 : <<extends>>\n\nusecase "Регистрация" as UC4\nusecase "Подтвердить email" as UC5\nUC4 ..> UC5 : <<includes>>\n@enduml\n```\n\n- `<<extends>>` — расширение (опционально)\n- `<<includes>>` — включение (обязательно)'
      },
      {
        title: 'Границы системы',
        content: '```plantuml\n@startuml\npackage "Магазин" {\n  usecase "Купить"\n  usecase "Корзина"\n}\nactor Покупатель\nПокупатель --> "Купить"\n@enduml\n```\n\n- `package "Name" { ... }` — граница системы/подсистемы'
      }
    ]
  },
  {
    id: 5,
    levelId: 5,
    title: 'State: Конечные автоматы',
    type: 'state',
    icon: '🔄',
    unlockCondition: 'level_5_puzzle',
    sections: [
      {
        title: 'State Machine Diagram',
        content: 'Показывает состояния объекта и переходы между ними по событиям.'
      },
      {
        title: 'Базовый синтаксис',
        content: '```plantuml\n@startuml\n[*] --> Off\nOff --> On : Включить\nOn --> Off : Выключить\nOn --> [*] : Выход\n@enduml\n```\n\n- `[*]` — начальное/конечное состояние\n- `State1 --> State2 : Event` — переход\n- `state "Name" as s1` — именованное состояние'
      },
      {
        title: 'Сложные состояния',
        content: '```plantuml\n@startuml\nstate "Работа" as Working {\n  [*] --> Idle\n  Idle --> Processing : Задача\n  Processing --> Idle : Готово\n}\n[*] --> Working\nWorking --> [*] : Выход\n@enduml\n```\n\n- `state Name { ... }` — составное состояние\n- Вложенные машины состояний\n- `entry` / `exit` действия при входе/выходе'
      },
      {
        title: 'История и параллельные области',
        content: '```plantuml\n@startuml\nstate "Main" {\n  [*] --> A\n  A --> B\n  B --> [*]\n  concurrent C {\n    [*] --> C1\n    C1 --> C2\n  }\n}\n@enduml\n```\n\n- `concurrent` — параллельные области (orthogonal regions)\n- `H` / `H*` — глубокая/мелкая история'
      }
    ]
  },
  {
    id: 6,
    levelId: 6,
    title: 'Sequence: Циклы и итерации',
    type: 'sequence',
    icon: '🔁',
    unlockCondition: 'level_6_puzzle',
    sections: [
      {
        title: 'Loop в Sequence Diagram',
        content: '```plantuml\n@startuml\nloop Для каждого заказа\n  Client -> Server: Обработать\n  Server --> Client: OK\nend\n@enduml\n```\n\n- `loop Название` ... `end` — блок цикла\n- Можно вкладывать `alt`, `opt`, `par` внутрь `loop`'
      },
      {
        title: 'Итерация по коллекции',
        content: '```plantuml\n@startuml\nloop items : Заказы\n  Client -> Service: Обработать(item)\nend\n@enduml\n```\n\n- `loop items : Коллекция` — итерация с именем переменной'
      }
    ]
  },
  {
    id: 7,
    levelId: 7,
    title: 'Class: Наследование и полиморфизм',
    type: 'class',
    icon: '🧬',
    unlockCondition: 'level_7_puzzle',
    sections: [
      {
        title: 'Наследование',
        content: '```plantuml\n@startuml\nclass Animal {\n  +name: String\n  +makeSound()\n}\nclass Dog extends Animal {\n  +breed: String\n  +makeSound() : "Гав"\n}\nclass Cat extends Animal {\n  +color: String\n  +makeSound() : "Мяу"\n}\n@enduml\n```\n\n- `extends` / `<|--` — наследование\n- Переопределение методов (полиморфизм)'
      },
      {
        title: 'Абстрактные классы и интерфейсы',
        content: '```plantuml\n@startuml\ninterface Flyable {\n  +fly()\n}\nabstract class Bird {\n  {abstract} +fly()\n  +eat()\n}\nclass Eagle extends Bird implements Flyable\n@enduml\n```\n\n- `interface` — интерфейс\n- `{abstract}` — абстрактный метод/класс\n- `implements` — реализация интерфейса'
      }
    ]
  },
  {
    id: 8,
    levelId: 8,
    title: 'Activity: Процессы и потоки',
    type: 'activity',
    icon: '📊',
    unlockCondition: 'level_8_puzzle',
    sections: [
      {
        title: 'Activity Diagram — назначение',
        content: 'Показывает поток управления и данных: действия, решения, слияния, параллелизм.'
      },
      {
        title: 'Базовый синтаксис',
        content: '```plantuml\n@startuml\nstart\n:Войти в систему;\nif (Админ?) then (да)\n  :Панель админа;\nelse (нет)\n  :Каталог;\nendif\n:Выход;\nstop\n@enduml\n```\n\n- `start` / `stop` — начало/конец\n- `:` Действие `;` — действие\n- `if (условие) then (да) ... else (нет) ... endif` — ветвление'
      },
      {
        title: 'Параллелизм (fork/join)',
        content: '```plantuml\n@startuml\nstart\nfork\n  :Задача 1;\n  :Задача 2;\nfork again\n  :Задача 3;\nend fork\n:Сборка результатов;\nstop\n@enduml\n```\n\n- `fork` / `fork again` / `end fork` — параллельные ветви'
      },
      {
        title: 'Swimlanes (дорожки)',
        content: '```plantuml\n@startuml\n|Пользователь|\nstart\n:Ввести данные;\n|Система|\n:Проверить;\n|Пользователь|\n:Получить результат;\nstop\n@enduml\n```\n\n- `|Lane|` — дорожка ответственного'
      }
    ]
  },
  {
    id: 9,
    levelId: 9,
    title: 'Component: Архитектура компонентов',
    type: 'component',
    icon: '🧩',
    unlockCondition: 'level_9_puzzle',
    sections: [
      {
        title: 'Component Diagram',
        content: 'Показывает компоненты системы и зависимости между ними: интерфейсы, порты, артефакты.'
      },
      {
        title: 'Компоненты и интерфейсы',
        content: '```plantuml\n@startuml\ninterface IService\nclass ServiceImpl implements IService\ncomponent "API Gateway" as GW\ncomponent "User Service" as US\nGW --> US : IService\n@enduml\n```\n\n- `interface` — интерфейс (lollipop)\n- `component` — компонент\n- `implements` — реализация\n- `-->` / `..>` — зависимость'
      },
      {
        title: 'Пакеты и артефакты',
        content: '```plantuml\n@startuml\npackage "Frontend" {\n  component "React App"\n}\npackage "Backend" {\n  component "Spring Boot"\n}\nartifact "Docker Image" as Docker\n"Spring Boot" ..> Docker\n@enduml\n```\n\n- `package` — логическая группировка\n- `artifact` — физический артефакт (jar, docker, war)'
      }
    ]
  },
  {
    id: 10,
    levelId: 10,
    title: 'Sequence: Параллельные процессы',
    type: 'sequence',
    icon: '⚡',
    unlockCondition: 'level_10_puzzle',
    sections: [
      {
        title: 'Параллелизм в Sequence Diagram',
        content: '```plantuml\n@startuml\npar Параллельные запросы\n  Client -> ServiceA: Запрос 1\nand\n  Client -> ServiceB: Запрос 2\nend\nServiceA --> Client: Ответ 1\nServiceB --> Client: Ответ 2\n@enduml\n```\n\n- `par` / `and` / `end` — параллельные фрагменты\n- Сообщения в разных `and` выполняются одновременно'
      },
      {
        title: 'Асинхронные сообщения',
        content: '```plantuml\n@startuml\nClient ->> Queue: Отправить задачу\nQueue -->> Worker: Обработать\nWorker -->> Result: Результат\n@enduml\n```\n\n- `->>` / `-->>` — асинхронные сообщения (пунктир с закрашенной головкой)\n- Полезны для очередей сообщений, event-driven архитектур'
      }
    ]
  },
  {
    id: 11,
    levelId: 11,
    title: 'Sequence: Заметки и аннотации',
    type: 'sequence',
    icon: '📝',
    unlockCondition: 'level_11_puzzle',
    sections: [
      {
        title: 'Заметки и аннотации',
        content: '```plantuml\n@startuml\nAlice -> Bob: Запрос\nnote right of Bob: Обработка...\nnote left of Alice: Ожидание\nBob --> Alice: Ответ\n@enduml\n```\n\n- `note left/right/over of` — позиция заметки\n- `note over Alice, Bob` — заметка над участниками\n- `box "Title" #color` — группировка'
      },
      {
        title: 'Цвета и стили',
        content: '```plantuml\n@startuml\nactor User #LightBlue\nparticipant Server #Pink\ndatabase DB #LightGreen\nUser -> Server #Blue: Запрос\nServer -> DB #Red: SQL\n@enduml\n```\n\n- `#Color` после имени — цвет участника\n- `#Color` после стрелки — цвет стрелки\n- `#RRGGBB` или названия цветов'
      }
    ]
  },
  {
    id: 12,
    levelId: 12,
    title: 'State: Обработка ошибок',
    type: 'state',
    icon: '⚠️',
    unlockCondition: 'level_12_puzzle',
    sections: [
      {
        title: 'Обработка ошибок в State Machine',
        content: '```plantuml\n@startuml\n[*] --> Idle\nIdle --> Processing : Start\nProcessing --> Success : OK\nProcessing --> Error : Fail\nError --> Idle : Retry\nError --> [*] : Abort\nSuccess --> [*]\n@enduml\n```\n\n- Обработка ошибок как отдельные состояния\n- Переходы `Retry`, `Abort`'
      },
      {
        title: 'Choice (псевдосостояние выбора)',
        content: '```plantuml\n@startuml\n[*] --> Check\nCheck --> Success : Успех\nCheck --> Fail : Ошибка\n@enduml\n```\n\n- Неявный choice при нескольких переходах из состояния\n- Условия на переходах (гуарды)'
      }
    ]
  },
  {
    id: 13,
    levelId: 13,
    title: 'Use Case: Библиотека — полный пример',
    type: 'usecase',
    icon: '📚',
    unlockCondition: 'level_13_puzzle',
    sections: [
      {
        title: 'Полный Use Case Diagram',
        content: '```plantuml\n@startuml\nactor "Читатель" as Reader\nactor "Библиотекарь" as Librarian\npackage "Библиотека" {\n  usecase "Поиск книги" as UC1\n  usecase "Взять книгу" as UC2\n  usecase "Вернуть книгу" as UC3\n  usecase "Продлить срок" as UC4\n  usecase "Каталог" as UC5\n}\nReader --> UC1\nReader --> UC2\nReader --> UC3\nReader --> UC4\nLibrarian --> UC5\nLibrarian --> UC2\nLibrarian --> UC3\n@enduml\n```'
      },
      {
        title: 'Include/Extend в практике',
        content: '```plantuml\n@startuml\nusecase "Взять книгу" as UC1\nusecase "Проверить штрафы" as UC2\nusecase "Выдать книгу" as UC3\nUC1 ..> UC2 : <<includes>>\nUC1 ..> UC3 : <<includes>>\n\nusecase "Резерв" as UC4\nUC4 ..> UC1 : <<extends>>\n@enduml\n```'
      }
    ]
  }
];

export function getTheoryByLevel(levelId) {
  return THEORY.find(t => t.levelId === levelId);
}

export function getAllTheory() {
  return THEORY;
}

export function isTheoryUnlocked(theoryId, gameState) {
  const theory = THEORY.find(t => t.id === theoryId);
  if (!theory) return false;
  // Разблокируется после прохождения пазла соответствующего уровня
  const progress = gameState.getLevelProgress(theory.levelId);
  return progress && progress.modes?.puzzle?.completed;
}