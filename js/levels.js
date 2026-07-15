export const LEVELS = [
  {
    id: 1,
    title: "Sequence: База",
    type: "sequence",
    puzzle: {
      kind: "tiles",
      intro: "Перетащи плитки в слоты, чтобы получилась диаграмма приветствия.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "Alice -> Bob : Привет" },
        { id: "c", text: "Bob -> Alice : Привет!" },
        { id: "d", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d"]
    },
    code: {
      taskType: "write",
      task: "Напиши с нуля диаграмму последовательности, где Alice отправляет «Привет» Bob, а Bob отвечает «Привет!».",
      template: null,
      expected: "@startuml\nAlice -> Bob : Привет\nBob -> Alice : Привет!\n@enduml",
      hints: [
        "Начни с @startuml",
        "Сообщение пишется как: Alice -> Bob : текст",
        "Закончи диаграмму @enduml"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Два человека здороваются друг с другом сообщениями.",
      expectedType: "sequence",
      keywords: ["Alice", "Bob", "Привет"],
      template: "@startuml\n___ -> ___ : ___\n___ -> ___ : ___\n@enduml"
    }
  },
  {
    id: 2,
    title: "Sequence: Условия",
    type: "sequence",
    puzzle: {
      kind: "reorder",
      intro: "Расставь строки в правильном порядке — диаграмма авторизации с условием.",
      lines: [
        "@enduml",
        "else failure",
        "actor User",
        "User -> System : Login",
        "alt success",
        "System -> User : Error",
        "System -> User : Dashboard",
        "@startuml",
        "participant System",
        "end"
      ],
      solution: [
        "@startuml",
        "actor User",
        "participant System",
        "User -> System : Login",
        "alt success",
        "  System -> User : Dashboard",
        "else failure",
        "  System -> User : Error",
        "end",
        "@enduml"
      ]
    },
    code: {
      taskType: "fill",
      task: "Дополни шаблон диаграммы авторизации: пользователь логинится, при успехе Dashboard, при неудаче — Error.",
      template: "@startuml\nactor ___\nparticipant ___\n___ -> ___ : Login\nalt ___\n  System -> User : ___\nelse ___\n  System -> User : ___\nend\n@enduml",
      expected: "@startuml\nactor User\nparticipant System\nUser -> System : Login\nalt success\n  System -> User : Dashboard\nelse failure\n  System -> User : Error\nend\n@enduml",
      hints: [
        "Актор участвует первым",
        "Используй alt ... else ... end",
        "В блоке alt пиши ответ системы"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Пользователь логинится. Система проверяет пароль и при успехе показывает Dashboard, при неудаче — ошибку.",
      expectedType: "sequence",
      keywords: ["пользователь", "система", "пароль", "Dashboard", "ошибк"],
      template: "@startuml\nactor ___\nparticipant ___\n___ -> ___ : ___\nalt ___\n  ___ -> ___ : ___\nelse ___\n  ___ -> ___ : ___\nend\n@enduml"
    }
  },
  {
    id: 3,
    title: "Class: Сущности",
    type: "class",
    puzzle: {
      kind: "tiles",
      intro: "Собери диаграмму классов: User и Order со связью.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "class User {" },
        { id: "c", text: "  id : int" },
        { id: "d", text: "  name : String" },
        { id: "e", text: "}" },
        { id: "f", text: "class Order" },
        { id: "g", text: "User \"1\" --> \"*\" Order : places" },
        { id: "h", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d", "e", "f", "g", "h"]
    },
    code: {
      taskType: "fill",
      task: "Дополни диаграмму классов: класс User с полями id и name, класс Order и связь 1 ко многим «places».",
      template: "@startuml\nclass ___ {\n  ___ : int\n  ___ : String\n}\nclass ___\nUser \"___\" --> \"___\" ___ : ___\n@enduml",
      expected: "@startuml\nclass User {\n  id : int\n  name : String\n}\nclass Order\nUser \"1\" --> \"*\" Order : places\n@enduml",
      hints: [
        "Класс User с атрибутами в фигурных скобках",
        "Связь: Class1 multiplicity --> multiplicity Class2 : label",
        "* означает много"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Модель интернет-магазина: покупатель (User) с id и именем может размещать много заказов (Order).",
      expectedType: "class",
      keywords: ["User", "Order", "id", "имя", "заказ"],
      template: "@startuml\nclass ___ {\n  ___\n  ___\n}\nclass ___\n___ --> ___ : ___\n@enduml"
    }
  },
  {
    id: 4,
    title: "Use Case: Акторы",
    type: "usecase",
    puzzle: {
      kind: "findbug",
      intro: "В готовом коде 2 ошибки. Нажми на строки, которые содержат баги.",
      code: "@startuml\nleft to right direction\nactor Guest\nrectagle Restaurant {\n  (View Menu) as VM\n  (Place Order) as PO\n}\nGuest --> VM\nGuest --> FP\n@enduml",
      bugLineIndices: [3, 8],
      hints: [
        "Проверь правописание ключевых слов",
        "Все акторы и прецеденты должны быть определены"
      ]
    },
    code: {
      taskType: "fix",
      task: "Исправь ошибки в диаграмме прецедентов: опечатка в слове rectangle и использование неопределённого прецедента FP.",
      broken: "@startuml\nleft to right direction\nactor Guest\nrectagle Restaurant {\n  (View Menu) as VM\n  (Place Order) as PO\n}\nGuest --> VM\nGuest --> FP\n@enduml",
      expected: "@startuml\nleft to right direction\nactor Guest\nrectangle Restaurant {\n  (View Menu) as VM\n  (Place Order) as PO\n}\nGuest --> VM\nGuest --> PO\n@enduml",
      hints: [
        "Проверь опечатку в ключевом слове rectangle",
        "Второй связью Guest подключается к Place Order"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Гость ресторана может просматривать меню и делать заказ.",
      expectedType: "usecase",
      keywords: ["гость", "меню", "заказ"],
      template: "@startuml\nleft to right direction\nactor ___\nrectangle ___ {\n  (___) as ___\n  (___) as ___\n}\n___ --> ___\n___ --> ___\n@enduml"
    }
  },
  {
    id: 5,
    title: "State: Автомат",
    type: "state",
    puzzle: {
      kind: "reorder",
      intro: "Расставь строки состояний автомата в правильном порядке.",
      lines: [
        "Active --> [*] : shutdown",
        "@startuml",
        "[*] --> Idle",
        "@enduml",
        "Idle --> Active : activate",
        "Active --> Idle : deactivate"
      ],
      solution: [
        "@startuml",
        "[*] --> Idle",
        "Idle --> Active : activate",
        "Active --> Idle : deactivate",
        "Active --> [*] : shutdown",
        "@enduml"
      ]
    },
    code: {
      taskType: "refactor",
      task: "Упрости громоздкий код диаграммы состояний, сохранив логику переходов.",
      broken: "@startuml\nstate Idle\nstate Active\n[*] --> Idle\nIdle --> Active : activate\nActive --> Idle : deactivate\nActive --> [*] : shutdown\n@enduml",
      expected: "@startuml\n[*] --> Idle\nIdle --> Active : activate\nActive --> Idle : deactivate\nActive --> [*] : shutdown\n@enduml",
      hints: [
        "Ключевые слова state не обязательны для простых состояний",
        "Можно описать переходы без явного объявления state"
      ]
    },
    describe: {
      kind: "free",
      scenario: "Опиши на естественном языке автомат состояний устройства: выключено, включено, выключено, завершение работы.",
      expectedType: "state",
      keywords: ["Idle", "Active", "activate", "deactivate", "shutdown"],
      template: "@startuml\n[*] --> Idle\nIdle --> Active : activate\nActive --> Idle : deactivate\nActive --> [*] : shutdown\n@enduml"
    }
  },
  {
    id: 6,
    title: "Sequence: Цикл",
    type: "sequence",
    puzzle: {
      kind: "tiles",
      intro: "Собери диаграмму с циклом: сервер отправляет уведомления клиенту.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "loop 3 раза" },
        { id: "c", text: "Server -> Client : Уведомление" },
        { id: "d", text: "Client -> Server : Подтверждение" },
        { id: "e", text: "end" },
        { id: "f", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d", "e", "f"]
    },
    code: {
      taskType: "fill",
      task: "Дополни диаграмму с циклом: сервер 3 раза отправляет уведомление, клиент подтверждает.",
      template: "@startuml\nloop ___ раза\n  ___ -> ___ : ___\n  ___ -> ___ : ___\nend\n@enduml",
      expected: "@startuml\nloop 3 раза\n  Server -> Client : Уведомление\n  Client -> Server : Подтверждение\nend\n@enduml",
      hints: [
        "Цикл начинается с loop и заканчивается end",
        "Число повторений указывается после loop",
        "Не забудь @startuml и @enduml"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Сервер отправляет уведомление клиенту 3 раза, клиент каждый раз подтверждает получение.",
      expectedType: "sequence",
      keywords: ["сервер", "клиент", "уведомление", "подтверждение", "loop"],
      template: "@startuml\nloop ___ раза\n  ___ -> ___ : ___\n  ___ -> ___ : ___\nend\n@enduml"
    }
  },
  {
    id: 7,
    title: "Class: Наследование",
    type: "class",
    puzzle: {
      kind: "reorder",
      intro: "Расставь строки — иерархия классов Животное, Собака, Кошка.",
      lines: [
        "@enduml",
        "abstract class Animal {",
        "  +name : String",
        "  +makeSound() : void",
        "}",
        "class Dog extends Animal {",
        "  +fetch() : void",
        "}",
        "class Cat extends Animal {",
        "  +purr() : void",
        "}",
        "@startuml"
      ],
      solution: [
        "@startuml",
        "abstract class Animal {",
        "  +name : String",
        "  +makeSound() : void",
        "}",
        "class Dog extends Animal {",
        "  +fetch() : void",
        "}",
        "class Cat extends Animal {",
        "  +purr() : void",
        "}",
        "@enduml"
      ]
    },
    code: {
      taskType: "write",
      task: "Напиши с нуля диаграмму классов: абстрактный класс Animal с name и makeSound(), класс Dog (extends Animal, метод fetch), класс Cat (extends Animal, метод purr).",
      template: null,
      expected: "@startuml\nabstract class Animal {\n  +name : String\n  +makeSound() : void\n}\nclass Dog extends Animal {\n  +fetch() : void\n}\nclass Cat extends Animal {\n  +purr() : void\n}\n@enduml",
      hints: [
        "Используй abstract class для базового класса",
        "Наследование через extends",
        "Методы и атрибуты внутри фигурных скобок"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Иерархия животных: абстрактный класс Animal с именем и методом звука. Dog и Cat наследуют Animal и имеют свои методы.",
      expectedType: "class",
      keywords: ["Animal", "Dog", "Cat", "name", "makeSound", "fetch", "purr"],
      template: "@startuml\nabstract class ___ {\n  +___ : ___\n  +___() : ___\n}\nclass ___ extends ___ {\n  +___() : ___\n}\nclass ___ extends ___ {\n  +___() : ___\n}\n@enduml"
    }
  },
  {
    id: 8,
    title: "Activity: Процесс",
    type: "activity",
    puzzle: {
      kind: "tiles",
      intro: "Собери диаграмму процесса регистрации пользователя.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "start" },
        { id: "c", text: ":Заполни форму;" },
        { id: "d", text: "if (Валидна?) then (да)" },
        { id: "e", text: ":Создать аккаунт;" },
        { id: "f", text: ":Отправить письмо;" },
        { id: "g", text: "else (нет)" },
        { id: "h", text: ":Показать ошибку;" },
        { id: "i", text: "endif" },
        { id: "j", text: "stop" },
        { id: "k", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"]
    },
    code: {
      taskType: "fill",
      task: "Дополни диаграмму процесса: пользователь заполняет форму, при валидации — аккаунт и письмо, иначе — ошибка.",
      template: "@startuml\nstart\n:___;\nif (___?) then (да)\n  :___;\n  :___;\nelse (нет)\n  :___;\nendif\nstop\n@enduml",
      expected: "@startuml\nstart\n:Заполни форму;\nif (Валидна?) then (да)\n  :Создать аккаунт;\n  :Отправить письмо;\nelse (нет)\n  :Показать ошибку;\nendif\nstop\n@enduml",
      hints: [
        "Диаграмма активности начинается с start и заканчивается stop",
        "Действия оборачиваются в : ;",
        "Условие: if (вопрос) then (да) ... else (нет) ... endif"
      ]
    },
    describe: {
      kind: "free",
      scenario: "Процесс регистрации: пользователь заполняет форму. Если она валидна — создаётся аккаунт и отправляется письмо. Если нет — показывается ошибка.",
      expectedType: "activity",
      keywords: ["start", "stop", "форма", "валидна", "аккаунт", "письмо", "ошибк"],
      template: "@startuml\nstart\n:Заполни форму;\nif (Валидна?) then (да)\n  :Создать аккаунт;\n  :Отправить письмо;\nelse (нет)\n  :Показать ошибку;\nendif\nstop\n@enduml"
    }
  },
  {
    id: 9,
    title: "Component: Архитектура",
    type: "component",
    puzzle: {
      kind: "findbug",
      intro: "В готовом коде 2 ошибки. Нажми на строки с багами.",
      code: "@startuml\npackage \"Frontend\" {\n  [React App] as frontend\n}\npackage \"Backend\" {\n  [API Server] as api\n  [Database] as db\n}\nfontend --> api : HTTP\napi --> db : SQL\n@enduml",
      bugLineIndices: [8, 9],
      hints: [
        "Проверь правописание имён компонентов",
        "Связи должны указывать на существующие компоненты"
      ]
    },
    code: {
      taskType: "fix",
      task: "Исправь ошибки в диаграмме компонентов: опечатка в имени компонента и неправильная связь.",
      broken: "@startuml\npackage \"Frontend\" {\n  [React App] as frontend\n}\npackage \"Backend\" {\n  [API Server] as api\n  [Database] as db\n}\nfontend --> api : HTTP\napi --> db : SQL\n@enduml",
      expected: "@startuml\npackage \"Frontend\" {\n  [React App] as frontend\n}\npackage \"Backend\" {\n  [API Server] as api\n  [Database] as db\n}\nfrontend --> api : HTTP\napi --> db : SQL\n@enduml",
      hints: [
        "Проверь опечатку в имени переменной fontend → frontend",
        "Все связи должны ссылаться на объявленные компоненты"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Веб-приложение: фронтенд на React общается с API-сервером по HTTP, сервер хранит данные в базе SQL.",
      expectedType: "component",
      keywords: ["Frontend", "Backend", "React", "API", "Database", "HTTP", "SQL"],
      template: "@startuml\npackage \"___\" {\n  [___] as ___\n}\npackage \"___\" {\n  [___] as ___\n  [___] as ___\n}\n___ --> ___ : ___\n___ --> ___ : ___\n@enduml"
    }
  },
  {
    id: 10,
    title: "Sequence: Параллель",
    type: "sequence",
    puzzle: {
      kind: "tiles",
      intro: "Собери диаграмму с параллельными процессами — сервер обрабатывает запросы параллельно.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "Client -> Server : Запрос" },
        { id: "c", text: "par Обработка" },
        { id: "d", text: "  Server -> DB : Чтение" },
        { id: "e", text: "  DB --> Server : Данные" },
        { id: "f", text: "  Server -> Cache : Запись" },
        { id: "g", text: "end" },
        { id: "h", text: "Server -> Client : Ответ" },
        { id: "i", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d", "e", "f", "g", "h", "i"]
    },
    code: {
      taskType: "fill",
      task: "Дополни шаблон диаграммы с параллельными блоками: клиент отправляет запрос, сервер параллельно читает из БД и пишет в кеш, затем возвращает ответ.",
      template: "@startuml\n___ -> ___ : ___\npar ___\n  ___ -> ___ : ___\n  ___ -> ___ : ___\nend\n___ -> ___ : ___\n@enduml",
      expected: "@startuml\nClient -> Server : Запрос\npar Обработка\n  Server -> DB : Чтение\n  Server -> Cache : Запись\nend\nServer -> Client : Ответ\n@enduml",
      hints: [
        "Параллельный блок начинается с par и заканчивается end",
        "После par можно указать название блока",
        "Сообщения внутри par выполняются параллельно"
      ]
    },
    describe: {
      kind: "free",
      scenario: "Клиент отправляет запрос серверу. Сервер параллельно обращается к базе данных и кешу, затем возвращает ответ клиенту.",
      expectedType: "sequence",
      keywords: ["Client", "Server", "DB", "Cache", "par", "запрос", "ответ"],
      template: "@startuml\nClient -> Server : Запрос\npar Обработка\n  Server -> DB : Чтение\n  Server -> Cache : Запись\nend\nServer -> Client : Ответ\n@enduml"
    }
  },
  {
    id: 11,
    title: "Sequence: Заметки",
    type: "sequence",
    puzzle: {
      kind: "tiles",
      intro: "Собери диаграмму последовательности с заметками (note) для комментариев.",
      tiles: [
        { id: "a", text: "@startuml" },
        { id: "b", text: "Alice -> Bob : Привет" },
        { id: "c", text: "note right of Bob" },
        { id: "d", text: "  Получил сообщение" },
        { id: "e", text: "end note" },
        { id: "f", text: "Bob -> Alice : Пока" },
        { id: "g", text: "note left of Alice" },
        { id: "h", text: "  Удивилась" },
        { id: "i", text: "end note" },
        { id: "j", text: "@enduml" }
      ],
      solution: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
    },
    code: {
      taskType: "fill",
      task: "Дополни шаблон диаграммы с заметками: Alice спрашивает «Как дела?», Bob отвечает «Хорошо!», добавь заметки к обеим сторонам.",
      template: "@startuml\n___ -> ___ : ___\nnote ___ of ___\n  ___:\nend note\n___ -> ___ : ___\nnote ___ of ___\n  ___:\nend note\n@enduml",
      expected: "@startuml\nAlice -> Bob : Как дела?\nnote right of Bob\n  Всё отлично!\nend note\nBob -> Alice : Хорошо!\nnote left of Alice\n  Рада слышать\nend note\n@enduml",
      hints: [
        "note right/left of Участник — начало заметки",
        "Заметка заканчивается end note",
        "Текст заметки внутри блока"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Пользователь (User) отправляет запрос системе (System). Система обрабатывает и возвращает результат.",
      expectedType: "sequence",
      keywords: ["User", "System", "запрос", "ответ"],
      template: "@startuml\n___ -> ___ : ___\n___ -> ___ : ___\n@enduml"
    }
  },
  {
    id: 12,
    title: "State: Обработка",
    type: "state",
    puzzle: {
      kind: "reorder",
      intro: "Расставь строки диаграммы состояний обработки заказа в правильном порядке.",
      lines: [
        "@enduml",
        "New --> Processing : pay",
        "[*] --> New",
        "@startuml",
        "Processing --> Completed : finish",
        "Processing --> Cancelled : cancel",
        "Completed --> [*]",
        "Cancelled --> [*]"
      ],
      solution: [
        "@startuml",
        "[*] --> New",
        "New --> Processing : pay",
        "Processing --> Completed : finish",
        "Processing --> Cancelled : cancel",
        "Completed --> [*]",
        "Cancelled --> [*]",
        "@enduml"
      ]
    },
    code: {
      taskType: "write",
      task: "Напиши с нуля диаграмму состояний заказа: новый → в обработке → завершён или отменён.",
      template: null,
      expected: "@startuml\n[*] --> New\nNew --> Processing : pay\nProcessing --> Completed : finish\nProcessing --> Cancelled : cancel\nCompleted --> [*]\nCancelled --> [*]\n@enduml",
      hints: [
        "Начало: [*] --> Состояние",
        "Переходы: Состояние --> Следующее : событие",
        "Конец: Состояние --> [*]"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "Заказ создаётся (New), после оплаты переходит в обработку (Processing). Из обработки заказ можно завершить (Completed) или отменить (Cancelled).",
      expectedType: "state",
      keywords: ["New", "Processing", "Completed", "Cancelled", "оплат", "заказ"],
      template: "@startuml\n[*] --> ___\n___ --> ___ : ___\n___ --> [*]\n@enduml"
    }
  },
  {
    id: 13,
    title: "Use Case: Библиотека",
    type: "usecase",
    puzzle: {
      kind: "findbug",
      intro: "В диаграмме прецедентов библиотеки 2 ошибки. Нажми на строки с багами.",
      code: "@startuml\nleft to right direction\nactor Librarian\nactor Borrower\nrectangle Library {\n  (Add Book) as AB\n  (Borrow Book) as BB\n  (Return Book) as RB\n}\nLibrarian --> AB\nLibrarian --> BB\nBorrower --> BB\nBorrower --> RB\n@enduml",
      bugLineIndices: [10, 11],
      hints: [
        "Проверь, какие акторы связаны с какими прецедентами",
        "Библиотекарь добавляет книги, но не берёт их"
      ]
    },
    code: {
      taskType: "refactor",
      task: "Упрости громоздкую диаграмму прецедентов библиотеки, сохранив всех акторов и прецеденты.",
      broken: "@startuml\nleft to right direction\nactor Librarian\nactor Borrower\nrectangle Library {\n  usecase (Add Book) as AB\n  usecase (Borrow Book) as BB\n  usecase (Return Book) as RB\n}\nLibrarian --> AB\nLibrarian --> BB\nBorrower --> BB\nBorrower --> RB\n@enduml",
      expected: "@startuml\nleft to right direction\nactor Librarian\nactor Borrower\nrectangle Library {\n  (Add Book) as AB\n  (Borrow Book) as BB\n  (Return Book) as RB\n}\nLibrarian --> AB\nBorrower --> BB\nBorrower --> RB\n@enduml",
      hints: [
        "Ключевое слово usecase избыточно — достаточно (Название) as alias",
        "Библиотекарь не берёт книги, только добавляет"
      ]
    },
    describe: {
      kind: "guided",
      scenario: "В библиотеке библиотекарь добавляет книги, а читатель берёт и возвращает книги.",
      expectedType: "usecase",
      keywords: ["библиотекарь", "читатель", "добавляет", "берёт", "возвращает"],
      template: "@startuml\nleft to right direction\nactor ___\nactor ___\nrectangle ___ {\n  (___) as ___\n  (___) as ___\n  (___) as ___\n}\n___ --> ___\n___ --> ___\n___ --> ___\n@enduml"
    }
  }
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === Number(id));
}

export function getLevelIndex(id) {
  return LEVELS.findIndex((l) => l.id === Number(id));
}
