/**
 * Practical projects/assignments — apply learned skills to real scenarios
 * Unlock progressively as theory is unlocked
 */
export const PROJECTS = [
  {
    id: 1,
    title: 'API Документация: Пользовательский сервис',
    type: 'sequence',
    icon: '📡',
    difficulty: 'Новичок',
    estimatedTime: '15 мин',
    unlockCondition: 'theory_1',
    description: 'Создайте Sequence Diagram для REST API пользовательского сервиса.',
    scenario: 'Клиент делает GET /users/{id}. Сервис проверяет кэш (Redis), если нет — запрашивает БД. При ошибке БД — возвращает 500. При успехе — кэширует и возвращает 200.',
    requirements: [
      'Актеры: Client, API Gateway, User Service, Redis, Database',
      'Показать успешный сценарий (кэш хит / кэш мисс)',
      'Показать сценарий ошибки БД (alt/else)',
      'Использовать актеры: actor, participant, database',
      'Добавить заметки с пояснениями'
    ],
    starterCode: `@startuml
actor Client
participant "API Gateway" as Gateway
participant "User Service" as Service
database Redis
database Database

Client -> Gateway: GET /users/{id}
Gateway -> Service: Forward request

' TODO: Добавить логику кэша и БД
' TODO: Добавить alt/else для ошибки БД

@enduml`,
    expectedPatterns: [
      'alt',
      'Redis',
      'Database',
      'note'
    ],
    hints: [
      'Используйте `alt Кэш есть` / `else Кэш пуст` для ветвления',
      'Redis — это database, используйте `database Redis`',
      'Добавьте `note right of Service: Проверка кэша` для пояснений'
    ],
    solution: `@startuml
actor Client
participant "API Gateway" as Gateway
participant "User Service" as Service
database Redis
database Database

Client -> Gateway: GET /users/{id}
Gateway -> Service: Forward request

alt Кэш есть
  Service -> Redis: GET user:{id}
  Redis --> Service: User data
  note right of Service: Cache HIT
else Кэш пуст
  Service -> Redis: GET user:{id}
  Redis --> Service: null
  note right of Service: Cache MISS
  Service -> Database: SELECT * FROM users WHERE id=?
  alt Пользователь найден
    Database --> Service: User data
    Service -> Redis: SET user:{id} (TTL 5m)
    note right of Service: Сохранено в кэш
  else Пользователь не найден
    Database --> Service: null
  end
else Ошибка БД
  Database --> Service: Exception
  Service --> Gateway: 500 Internal Server Error
  Gateway --> Client: 500
end

Gateway --> Client: 200 OK + User JSON
@enduml`
  },
  {
    id: 2,
    title: 'Доменная модель: Интернет-магазин',
    type: 'class',
    icon: '🛒',
    difficulty: 'Новичок',
    estimatedTime: '20 мин',
    unlockCondition: 'theory_3',
    description: 'Спроектируйте Class Diagram для основных сущностей интернет-магазина.',
    scenario: 'Есть Пользователи, Заказы, Товары, Категории, Платежи. Пользователь может иметь много заказов. Заказ содержит позиции заказа (товар + количество). Товар принадлежит категории. Платеж привязан к заказу.',
    requirements: [
      'Классы: User, Order, OrderItem, Product, Category, Payment',
      'Атрибуты с типами и видимостью',
      'Связи: ассоциация, композиция, агрегация',
      'Множественности (1, *, 0..1, 1..*)',
      'Наследование: PremiumUser extends User'
    ],
    starterCode: `@startuml
' TODO: Объявите классы с атрибутами и методами
' TODO: Добавьте связи с правильными стрелками и множественностями

@enduml`,
    expectedPatterns: [
      'class',
      '<|--',
      '*--',
      'o--',
      '-->',
      '*',
      '1'
    ],
    hints: [
      'Order *-- OrderItem — композиция (заказ владеет позициями)',
      'User --> Order — ассоциация (пользователь делает заказы)',
      'Product o-- Category — агрегация (товар в категории, но может существовать без неё)',
      'PremiumUser <|-- User — наследование'
    ],
    solution: `@startuml
class User {
  +id: Long
  +email: String
  +name: String
  +passwordHash: String
  +createdAt: DateTime
  +login()
  +logout()
  +updateProfile()
}

class PremiumUser extends User {
  +discountPercent: Integer
  +bonusPoints: Long
  +applyDiscount()
}

class Order {
  +id: Long
  +orderNumber: String
  +status: OrderStatus
  +totalAmount: Decimal
  +createdAt: DateTime
  +addItem(product, quantity)
  +calculateTotal()
  +pay()
}

class OrderItem {
  +id: Long
  +quantity: Integer
  +unitPrice: Decimal
  +getSubtotal()
}

class Product {
  +id: Long
  +name: String
  +description: String
  +price: Decimal
  +stockQuantity: Integer
  +isAvailable()
  +reserveStock(qty)
  +releaseStock(qty)
}

class Category {
  +id: Long
  +name: String
  +description: String
  +parent: Category
  +getChildren()
}

class Payment {
  +id: Long
  +amount: Decimal
  +method: PaymentMethod
  +status: PaymentStatus
  +transactionId: String
  +paidAt: DateTime
  +process()
  +refund()
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  CARD
  PAYPAL
  BANK_TRANSFER
  CASH_ON_DELIVERY
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

User "1" --> "*" Order : places
Order "*" *-- "1..*" OrderItem : contains
OrderItem "*" --> "1" Product : references
Product "*" o-- "0..1" Category : belongs to
Category "1" <-- "0..*" Category : subcategories
Order "1" --> "1" Payment : paid by
PremiumUser <|-- User
@enduml`
  },
  {
    id: 3,
    title: 'Use Case: Система бронирования билетов',
    type: 'usecase',
    icon: '🎫',
    difficulty: 'Новичок',
    estimatedTime: '15 мин',
    unlockCondition: 'theory_4',
    description: 'Создайте Use Case Diagram для системы онлайн-бронирования билетов.',
    scenario: 'Покупатель ищет мероприятия, выбирает места, оплачивает, получает билет. Администратор управляет мероприятиями, залами, схемами мест. Система отправляет уведомления (email/sms).',
    requirements: [
      'Актеры: Покупатель, Администратор, Платежная система, Уведомления',
      'Прецеденты для покупателя: поиск, выбор мест, оплата, билет, история',
      'Прецеденты для админа: CRUD мероприятий, залы, схемы, отчеты',
      'Отношения: include (оплата включает платежную систему), extend (уведомления)',
      'Границы системы (package)'
    ],
    starterCode: `@startuml
actor "Покупатель" as Buyer
actor "Администратор" as Admin
actor "Платёжная система" as Payment
actor "Уведомления" as Notifier

' TODO: Добавьте прецеденты и связи
' TODO: Используйте package для границы системы
' TODO: Добавьте <<include>> и <<extend>>

@enduml`,
    expectedPatterns: [
      'actor',
      'usecase',
      'package',
      '<<include>>',
      '<<extend>>'
    ],
    hints: [
      'Оплата <<include>> Платежная система — обязательная часть',
      'Отправка уведомления <<extend>> — опциональная',
      'Используйте package "Система бронирования" для границы'
    ],
    solution: `@startuml
actor "Покупатель" as Buyer
actor "Администратор" as Admin
actor "Платёжная система" as Payment
actor "Сервис уведомлений" as Notifier

package "Система бронирования" {
  usecase "Поиск мероприятий" as UC1
  usecase "Просмотр схемы зала" as UC2
  usecase "Выбор мест" as UC3
  usecase "Оплата заказа" as UC4
  usecase "Получение билета" as UC5
  usecase "История заказов" as UC6

  usecase "Управление мероприятиями" as UC7
  usecase "Управление залами и схемами" as UC8
  usecase "Просмотр отчётов" as UC9
}

Buyer --> UC1
Buyer --> UC2
Buyer --> UC3
Buyer --> UC4
Buyer --> UC5
Buyer --> UC6

Admin --> UC7
Admin --> UC8
Admin --> UC9

UC4 ..> Payment : <<includes>>
UC5 ..> Notifier : <<extends>>
UC4 ..> Notifier : <<extends>>

@enduml`
  },
  {
    id: 4,
    title: 'State Machine: Жизненный цикл заказа',
    type: 'state',
    icon: '📦',
    difficulty: 'Средний',
    estimatedTime: '20 мин',
    unlockCondition: 'theory_5',
    description: 'Спроектируйте State Machine Diagram для жизненного цикла заказа в интернет-магазине.',
    scenario: 'Заказ проходит этапы: Создан → Оплачен → Собран → Отправлен → Доставлен. В любой момент можно отменить (до Отправлен). При проблеме — возврат. Есть обработка ошибок оплаты.',
    requirements: [
      'Состояния: Draft, Confirmed, Paid, Assembling, Shipped, Delivered, Cancelled, Refunded',
      'Переходы с событиями',
      'Начальное и конечное состояния',
      'Обработка ошибки оплаты (choice)',
      'Составное состояние "В обработке" (Assembling + Shipped)',
      'История (H) для возврата к обработке'
    ],
    starterCode: `@startuml
[*] --> Draft

' TODO: Добавьте все состояния и переходы
' TODO: Добавьте составное состояние "В обработке"
' TODO: Добавьте choice для оплаты
' TODO: Добавьте историю (H)

@enduml`,
    expectedPatterns: [
      'state',
      '[*]',
      '-->',
      'choice',
      'H'
    ],
    hints: [
      'Используйте `state "В обработке" { Assembling --> Shipped }` для составного',
      'Choice: `state choice <<choice>>` затем переходы от него',
      'История: `H` или `H*` внутри составного состояния'
    ],
    solution: `@startuml
[*] --> Draft

state "В обработке" as Processing {
  [*] --> Assembling
  Assembling --> Shipped : Упакован и передан перевозчику
  H
}

Draft --> Confirmed : Подтверждён покупателем
Confirmed --> Paid : Оплачен
Confirmed --> Cancelled : Отменён

state "Оплата" {
  [*] --> ProcessingPayment
  state choice <<choice>> as PaymentChoice
  ProcessingPayment --> PaymentChoice
  PaymentChoice --> Paid : Успех
  PaymentChoice --> PaymentFailed : Ошибка
}

PaymentFailed --> Confirmed : Повторить оплату
PaymentFailed --> Cancelled : Отменить

Paid --> Processing : Передан на сборку
Processing --> Shipped
Shipped --> Delivered : Получен покупателем
Delivered --> [*]

Cancelled --> [*]
Refunded --> [*]

@enduml`
  },
  {
    id: 5,
    title: 'Activity: CI/CD Pipeline',
    type: 'activity',
    icon: '🚀',
    difficulty: 'Средний',
    estimatedTime: '20 мин',
    unlockCondition: 'theory_8',
    description: 'Создайте Activity Diagram для современного CI/CD пайплайна.',
    scenario: 'Push в main → Запуск пайплайна → Параллельно: Линт, Тесты, Сборка → Если все прошли — Деплой в Staging → Ручное одобрение → Деплой в Production. При ошибке — уведомление.',
    requirements: [
      'Start/Stop',
      'Fork/Join для параллельных этапов',
      'Decision (if) для проверки результатов',
      'Swimlanes: CI, CD, Уведомления',
      'Merge после параллельных задач'
    ],
    starterCode: `@startuml
start

' TODO: Этап CI (параллельно: lint, test, build)
' TODO: Проверка результатов (if)
' TODO: Этап CD: Staging -> Approve -> Production
' TODO: Swimlanes для CI, CD, Notifications
' TODO: Обработка ошибок с уведомлением

stop
@enduml`,
    expectedPatterns: [
      'fork',
      'fork again',
      'end fork',
      'if',
      '|Swimlane|',
      'stop'
    ],
    hints: [
      'fork / fork again / end fork для параллелизма',
      '|CI| / |CD| / |Notify| для дорожек',
      'if (Все тесты прошли?) then (да) ... else (нет) ... endif'
    ],
    solution: `@startuml
start

|CI|
:Push в main;
fork
  :Lint (ESLint/Checkstyle);
fork again
  :Unit Tests;
fork again
  :Build (Docker image);
end fork

if (Все этапы прошли?) then (да)
  |CD|
  :Deploy to Staging;
  :Smoke tests;
  if (Staging OK?) then (да)
    :Ручное одобрение;
    :Deploy to Production;
    |Notify|
    :Уведомить: Деплой успешен;
  else (нет)
    |Notify|
    :Уведомить: Ошибка в Staging;
  endif
else (нет)
  |Notify|
  :Уведомить: Сборка провалилась;
endif

stop
@enduml`
  },
  {
    id: 6,
    title: 'Component: Микросервисная архитектура',
    type: 'component',
    icon: '🏗️',
    difficulty: 'Продвинутый',
    estimatedTime: '25 мин',
    unlockCondition: 'theory_9',
    description: 'Спроектируйте Component Diagram для микросервисного интернет-магазина.',
    scenario: 'Сервисы: API Gateway, Auth, Catalog, Cart, Order, Payment, Notification, Inventory. Базы данных у каждого сервиса свои. Коммуникация: sync (REST/gRPC) и async (Kafka). Есть общий кэш Redis.',
    requirements: [
      'Компоненты для каждого сервиса',
      'Интерфейсы (lollipop) для API',
      'Базы данных как артефакты или компоненты',
      'Message Broker (Kafka) как компонент',
      'Зависимости: синхронные (прямые) и асинхронные (через Kafka)',
      'Пакеты для группировки: Frontend, Backend, Data, Infrastructure'
    ],
    starterCode: `@startuml
' TODO: Пакеты для группировки
' TODO: Компоненты сервисов с интерфейсами
' TODO: Базы данных, Kafka, Redis
' TODO: Зависимости: --> (sync), ..> (async via Kafka)

@enduml`,
    expectedPatterns: [
      'component',
      'interface',
      'package',
      'artifact',
      '..>',
      '-->'
    ],
    hints: [
      'interface "REST API" as REST для lollipop',
      'component "Order Service" implements REST',
      'artifact "orders.db" как база',
      '..> через Kafka для async'
    ],
    solution: `@startuml
package "Frontend" {
  component "Web App" as Web
  component "Mobile App" as Mobile
}

package "API Gateway" {
  component "Gateway" as GW
  interface "REST/gRPC" as GW_API
  GW implements GW_API
}

package "Backend Services" {
  component "Auth Service" as Auth
  interface "Auth API" as AuthAPI
  Auth implements AuthAPI

  component "Catalog Service" as Catalog
  interface "Catalog API" as CatAPI
  Catalog implements CatAPI

  component "Cart Service" as Cart
  interface "Cart API" as CartAPI
  Cart implements CartAPI

  component "Order Service" as Order
  interface "Order API" as OrdAPI
  Order implements OrdAPI

  component "Payment Service" as Payment
  interface "Payment API" as PayAPI
  Payment implements PayAPI

  component "Inventory Service" as Inventory
  interface "Inventory API" as InvAPI
  Inventory implements InvAPI

  component "Notification Service" as Notify
  interface "Notify API" as NotAPI
  Notify implements NotAPI
}

package "Infrastructure" {
  component "Kafka" as Kafka
  component "Redis" as Redis
}

package "Data" {
  artifact "auth.db" as AuthDB
  artifact "catalog.db" as CatDB
  artifact "cart.db" as CartDB
  artifact "order.db" as OrdDB
  artifact "payment.db" as PayDB
  artifact "inventory.db" as InvDB
}

Web --> GW_API
Mobile --> GW_API

GW_API --> AuthAPI
GW_API --> CatAPI
GW_API --> CartAPI
GW_API --> OrdAPI
GW_API --> PayAPI

Auth --> AuthDB
Catalog --> CatDB
Cart --> CartDB
Cart --> Redis
Order --> OrdDB
Order ..> Kafka : OrderCreated
Payment --> PayDB
Payment ..> Kafka : PaymentResult
Inventory --> InvDB
Inventory ..> Kafka : StockUpdated
Notify ..> Kafka : Consume events

@enduml`
  },
  {
    id: 7,
    title: 'Комплексный проект: Система управления задачами (Task Manager)',
    type: 'mixed',
    icon: '📋',
    difficulty: 'Продвинутый',
    estimatedTime: '40 мин',
    unlockCondition: 'theory_13',
    description: 'Финальный проект: создайте полный набор диаграмм для Task Manager (как Trello/Jira).',
    scenario: 'Пользователи создают доски, списки, карточки. Есть назначение исполнителей, дедлайны, комментарии, вложения, активность. Роли: Admin, Member, Viewer. Уведомления по email/push. Интеграция с Git (ссылки на коммиты/PR).',
    requirements: [
      'Use Case Diagram: все актеры и прецеденты',
      'Class Diagram: доменная модель (Board, List, Card, User, Comment, Attachment, Activity, Label)',
      'Sequence Diagram: создание карточки с назначением и уведомлением',
      'State Diagram: жизненный цикл карточки (Backlog → In Progress → Review → Done)',
      'Component Diagram: микросервисы (Board, Card, User, Notification, Integration)',
      'Activity Diagram: процесс код-ревью карточки'
    ],
    starterCode: `@startuml
' TODO: Создайте все 6 диаграмм
' Разделите их разделителями или создайте отдельные файлы

@enduml`,
    expectedPatterns: [
      'usecase',
      'class',
      'sequence',
      'state',
      'component',
      'activity'
    ],
    hints: [
      'Начните с Use Case — определите актеры и прецеденты',
      'Class Diagram — сердце доменной модели',
      'Sequence — один ключевой сценарий (создание карточки)',
      'State — жизненный цикл статуса карточки',
      'Component — разбиение на сервисы',
      'Activity — процесс ревью с параллельными проверками'
    ],
    solution: `@startuml
' ============ USE CASE ============
actor "Администратор" as Admin
actor "Участник" as Member
actor "Наблюдатель" as Viewer
actor "Git Integration" as Git
actor "Email Service" as Email

package "Task Manager" {
  usecase "Управление досками" as UC1
  usecase "Управление карточками" as UC2
  usecase "Назначение исполнителей" as UC3
  usecase "Комментарии и активность" as UC4
  usecase "Метки и дедлайны" as UC5
  usecase "Поиск и фильтры" as UC6
  usecase "Настройка прав доступа" as UC7
  usecase "Интеграция с Git" as UC8
  usecase "Уведомления" as UC9
}

Admin --> UC1
Admin --> UC7
Member --> UC2
Member --> UC3
Member --> UC4
Member --> UC5
Member --> UC6
Viewer --> UC6
Git --> UC8
UC9 ..> Email : <<includes>>
UC4 ..> UC9 : <<extends>>
UC3 ..> UC9 : <<extends>>

@enduml

@startuml
' ============ CLASS DIAGRAM ============
class User {
  +id: UUID
  +email: String
  +name: String
  +avatarUrl: String
  +role: Role
  +createdAt: DateTime
}

class Board {
  +id: UUID
  +title: String
  +description: String
  +visibility: Visibility
  +createdAt: DateTime
  +addMember(user, role)
  +removeMember(user)
}

class List {
  +id: UUID
  +title: String
  +position: Integer
  +board: Board
  +addCard(card)
  +moveCard(card, position)
}

class Card {
  +id: UUID
  +title: String
  +description: String
  +position: Integer
  +dueDate: DateTime
  +status: CardStatus
  +list: List
  +assignees: Set<User>
  +labels: Set<Label>
  +moveTo(list, position)
  +assign(user)
  +addLabel(label)
}

class Comment {
  +id: UUID
  +content: String
  +author: User
  +card: Card
  +createdAt: DateTime
  +mentions: Set<User>
}

class Attachment {
  +id: UUID
  +fileName: String
  +url: String
  +size: Long
  +card: Card
  +uploadedBy: User
}

class Label {
  +id: UUID
  +name: String
  +color: String
}

class Activity {
  +id: UUID
  +action: String
  +actor: User
  +card: Card
  +timestamp: DateTime
  +metadata: JSON
}

enum Role { ADMIN, MEMBER, VIEWER }
enum Visibility { PRIVATE, WORKSPACE, PUBLIC }
enum CardStatus { BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, ARCHIVED }

Board "1" *-- "*" List : contains
List "1" *-- "*" Card : contains
Card "*" --> "*" User : assignees
Card "*" --> "*" Label : labels
Card "1" *-- "*" Comment : has
Card "1" *-- "*" Attachment : has
Card "1" *-- "*" Activity : generates
User "1" --> "*" Board : memberships
Board "1" --> "*" User : members

@enduml

@startuml
' ============ SEQUENCE: Create Card ============
actor User
participant "Board Service" as BoardSvc
participant "Card Service" as CardSvc
participant "Notification Svc" as NotifySvc
database "Card DB" as CardDB
database "Activity DB" as ActDB
queue "Kafka" as Kafka

User -> BoardSvc: POST /boards/{id}/lists/{listId}/cards
BoardSvc -> CardSvc: CreateCard(cmd)
CardSvc -> CardDB: INSERT card
CardDB --> CardSvc: Card created
CardSvc -> ActDB: INSERT activity
CardSvc -> Kafka: Publish CardCreatedEvent
Kafka --> NotifySvc: Consume
NotifySvc -> Email: Send assignment email
CardSvc --> BoardSvc: CardDTO
BoardSvc --> User: 201 Created + Card

@enduml

@startuml
' ============ STATE: Card Status ============
[*] --> BACKLOG
BACKLOG --> TODO : Запланировано
TODO --> IN_PROGRESS : Начать работу
IN_PROGRESS --> IN_REVIEW : Завершить работу
IN_REVIEW --> DONE : Одобрено
IN_REVIEW --> IN_PROGRESS : На доработку
DONE --> ARCHIVED : Архивировать
BACKLOG --> ARCHIVED : Архивировать
TODO --> ARCHIVED : Архивировать
IN_PROGRESS --> ARCHIVED : Архивировать

state "Активная работа" as Active {
  IN_PROGRESS
  IN_REVIEW
}

@enduml

@startuml
' ============ COMPONENT ============
package "Frontend" {
  component "Web App"
  component "Mobile App"
}

package "API Gateway" {
  component Gateway
}

package "Services" {
  component "Board Service"
  component "Card Service"
  component "User Service"
  component "Notification Service"
  component "Integration Service"
}

package "Infrastructure" {
  component Kafka
  component Redis
}

package "Databases" {
  artifact board_db
  artifact card_db
  artifact user_db
  artifact activity_db
}

Web --> Gateway
Mobile --> Gateway

Gateway --> "Board Service"
Gateway --> "Card Service"
Gateway --> "User Service"

"Board Service" --> board_db
"Card Service" --> card_db
"Card Service" ..> Kafka : CardEvents
"User Service" --> user_db
"Notification Service" ..> Kafka : Consume Events
"Notification Service" --> Redis : Templates/Cache
"Integration Service" ..> Kafka : GitEvents
"Integration Service" --> "Card Service" : Link commits

@enduml

@startuml
' ============ ACTIVITY: Code Review ============
|Author|
start
:Создать PR;
|Reviewer|
fork
  :Code Review;
  :Проверить тесты;
fork again
  :Security Scan;
  :Lint/Style;
end fork

if (Все проверки пройдены?) then (да)
  :Approve;
  |Author|
  :Merge;
  |System|
  :Deploy to Staging;
  :Run E2E Tests;
  if (Staging OK?) then (да)
    :Deploy to Production;
    :Уведомить команду;
  else (нет)
    :Rollback;
    :Уведомить: Ошибка деплоя;
  endif
else (нет)
  |Author|
  :Исправить замечания;
  :Push обновлений;
  repeat
endif

stop
@enduml`
  }
];

export function getProjectById(id) {
  return PROJECTS.find(p => p.id === id);
}

export function getAllProjects() {
  return PROJECTS;
}

export function getProjectsByType(type) {
  if (type === 'mixed') return PROJECTS.filter(p => p.type === 'mixed');
  return PROJECTS.filter(p => p.type === type);
}

export function isProjectUnlocked(projectId, gameState) {
  const project = PROJECTS.find(p => p.id === projectId);
  if (!project) return false;
  
  // Check unlock condition
  if (project.unlockCondition.startsWith('theory_')) {
    const theoryId = parseInt(project.unlockCondition.replace('theory_', ''));
    // Theory unlocks when corresponding level's puzzle is completed
    const theory = project.unlockCondition; // We'll check via gameState
    // For simplicity, check if the theory level's puzzle is done
    const theoryIdx = PROJECTS.findIndex(p => p.id === projectId);
    // Theory unlock logic is handled in main.js
    return gameState.isTheoryUnlocked(theoryId);
  }
  return true;
}