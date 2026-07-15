# PlantUML Quest 🌱

Браузерная игра для изучения **PlantUML** — языка описания диаграмм. Проходи уровни в трёх режимах: собирай пазлы из плиток, пиши код с нуля и превращай описания на естественном языке в диаграммы.

![PlantUML Quest](https://img.shields.io/badge/PlantUML-Quest-green?style=for-the-badge&logo=plantuml)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🎮 Режимы игры

| Режим | Описание |
|-------|----------|
| **🧩 Пазл** | Собирай диаграммы из готовых блоков (плиток) drag-and-drop |
| **⌨️ Код** | Пиши PlantUML-код с нуля по заданию, получай мгновенную обратную связь |
| **🗣️ Описание** | Опиши диаграмму на естественном языке — нейросеть сгенерирует код |

---

## 🚀 Быстрый старт

### Требования
- **Node.js 18+**
- **PlantUML-running PlantUML server on `http://localhost:8080`

### Запуск PlantUML сервера (Docker)
```bash
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
```

### Запуск игры
```bash
cd plantuml-game
npm install
npm start
```

Откройте в браузере: **http://localhost:3000**

---

## 📁 Структура проекта

```
plantuml-game/
├── index.html              # SPA: 3 экрана (home, levels, game)
├── server.js               # Node.js сервер (порт 3000) + прокси PlantUML
├── package.json
├── css/
│   ├── base.css            # CSS-переменные, темы dark/light, reset, типографика
│   ├── components.css      # Карточки, кнопки, слоты, плитки, модалки, прогресс
│   ├── game-modes.css      # Стили для 3 игровых режимов
│   └── responsive.css      # Адаптивность
├── js/
│   ├── main.js             # Точка входа, роутинг экранов
│   ├── state.js            # Состояние игры (прогресс, уровни, тема)
│   ├── levels.js           # Определение уровней (пазл/код/описание)
│   ├── config.js           # API_BASE для PlantUML
│   ├── plantuml-api.js     # Работа с PlantUML сервером (кодирование, рендер)
│   ├── renderer.js         # Рендеринг SVG диаграмм
│   ├── validator.js        # Валидация PlantUML кода
│   ├── game-puzzle.js      # Режим "Пазл" (tiles, reorder, findbug)
│   ├── game-code.js        # Режим "Код" (редактор + валидация)
│   ├── game-describe.js    # Режим "Описание" (генерация из текста)
│   ├── ui.js               # UI утилиты (toast, modal, tabs)
│   └── accessibility.js    # Доступность (focus trap, анонсы)
└── assets/                 # (пусто, для будущих ассетов)
```

---

## 🛠️ Технологии

- **Vanilla JS (ES Modules)** — без бандлеров и фреймворков
- **Node.js (ESM)** — статический сервер + прокси к PlantUML
- **PlantUML Server** — рендеринг диаграмм (Docker: `plantuml/plantuml-server:jetty`)
- **pako** — сжатие PlantUML в URL (CDN)
- **CSS Custom Properties** — темизация (dark/light), адаптивность
- **Drag & Drop API** — нативный для пазлов и реордера

---

## 🎯 Уровни

В игре **10 уровней** по 3 режима каждый:

| # | Тема | Пазл | Код | Описание |
|---|------|------|-----|----------|
| 1 | Последовательность | tiles | sequence | sequence |
| 2 | Use Case | tiles | usecase | usecase |
| 3 | Классовая диаграмма | reorder | class | class |
| 4 | Состояния | findbug | state | state |
| 5 | Активность | tiles | activity | activity |
| 6 | Компоненты | reorder | component | component |
| 7 | Развёртывание | tiles | deployment | deployment |
| 8 | Объекты | findbug | object | object |
| 9 | Времена | tiles | timing | timing |
| 10| Mindmap | reorder | mindmap | mindmap |

Прогресс сохраняется в `localStorage` (звёзды, пройденные режимы).

---

## 🎨 Особенности реализации

### Пазл (tiles / reorder / findbug)
- **Tiles** — drag-and-drop плиток в слоты с валидацией решения
- **Reorder** — перетаскивание строк кода с FLIP-анимацией
- **Findbug** — поиск багов в коде по клику на строки
- Подсказки (пошаговые), показ ответа, подсчёт ошибок

### Режим "Код"
- Редактор с подсветкой (JetBrains Mono)
- Валидация через PlantUML сервер (рендер + проверка ошибок)
- Сравнение с эталонным решением (нормализация пробелов)

### Режим "Описание"
- Генерация PlantUML кода из естественного языка (промпт-инжиниринг)
- Ключевые слова для проверки качества генерации

---

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Tab` / `Shift+Tab` | Навигация по табам режимов |
| `Enter` / `Space` | Активация кнопок, выбор строки (findbug) |
| `Escape` | Закрыть модалку, выход из режима drag |
| `↑` `↓` `←` `→` | Навигация в списках, перемещение плиток |

---

## 🌐 Доступность (a11y)

- Семантический HTML, ARIA-роли (`role="list"`, `role="tab"`, `aria-live`)
- Focus trap в модалках
- Skip-link к основному контенту
- Контрастные темы (dark/light)
- Анонсы toast/модалок через `aria-live`

---

## 🔧 Конфигурация

В `js/config.js` можно задать `API_BASE` для PlantUML сервера:
```js
export const API_BASE = 'http://localhost:8080'; // по умолчанию пусто — прокси через сервер
```

В `server.js` настраивается прокси:
```js
const PORT = 3000;
const PLANTUML_HOST = 'localhost';
const PLANTUML_PORT = 8080;
```

---

## 📦 Скрипты

```bash
npm start      # Запуск сервера (порт 3000)
```

---

## 📄 Лицензия

MIT License — см. файл [LICENSE](LICENSE)

---

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📝 Changelog

См. [CHANGES.md](CHANGES.md) (если есть) или историю коммитов.

---

**Сделано с ❤️ для изучения PlantUML**