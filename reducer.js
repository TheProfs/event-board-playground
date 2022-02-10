'use strict'

const shortid = require('shortid')

const events = [
  { id_event: 1, name: 'item-added' },
  { id_event: 2, name: 'item-added' },
  { id_event: 3, name: 'item-added' },
  { id_event: 4, name: 'board-added', data: JSON.stringify({ boardId: 5555555 }) },
  { id_event: 5, name: 'board-switched', data: JSON.stringify({ boardId: 5555555 }) },
  { id_event: 6, name: 'item-added' },
  { id_event: 7, name: 'item-added' },
  { id_event: 8, name: 'board-switched', data: JSON.stringify({ boardId: 1111111 }) },
  { id_event: 9, name: 'board-duplicated', data: JSON.stringify({ boardId: 1111111, newBoardId: 7777777 }) },
  { id_event: 10, name: 'item-added' },
  { id_event: 11, name: 'item-added' }
]

// @NOTE
// - Do NOT convert v2 papers. It will destroy them!

// @TODO Add all possible canvas events
const canvasEvents = [
  'item-added',
  'cleared-canvas',
  'items-attribute-changed',
  'items-deleted',
  'items-moved-to-project',
  'items-moved',
  'items-pasted',
  'items-rotated',
  'items-scaled',
  'view-position-changed',
  'undo',
  'redo'
]

class SavedEvent {
  constructor(props, { board_id }) {
    Object.assign(this, props)
    this.board_id = board_id
    this.is_canvas_event = false
  }
}

class SavedCanvasEvent extends SavedEvent {
  constructor(props, { board_id }) {
    super(props, { board_id })
    this.is_canvas_event = true
  }
}

class UnsavedCanvasEvent extends SavedCanvasEvent {
  constructor(props, { board_id }) {
    super(props, { board_id })
    this.guid = shortid.generate()
    this.id_event = undefined
    this.created_at = undefined
  }
}

const currentFirstBoardId = 1111111
const newFirstBoardId = shortid.generate()

const result = events.map(event => {
  event.data = event.data ? JSON.parse(event.data) : null

  if (!event.data)
    return event

  switch (event.name) {
    case 'board-switched':
    case 'board-deleted':
    case 'board-duplicated':
      if (event.data.boardId !== currentFirstBoardId)
        return event

      event.data.boardId = newFirstBoardId

      return event
      break;
    default:
      return event
  }
}).reduce((acc, event) => {
  switch (event.name) {
    case 'board-switched':
      acc.currBoardId = event.data.boardId
      break;
    case 'board-duplicated':
      const duplicatedEvents = acc.events
        .filter(e => e.board_id === event.data.boardId)
        .filter(e => canvasEvents.includes(e.name))
        .map(e => new UnsavedCanvasEvent(e, {
          board_id: event.data.newBoardId
        }))

      acc.events.push(new SavedEvent(event, { board_id: acc.currBoardId }))
      acc.events = acc.events.concat(duplicatedEvents)

      return acc

      break;
  }

  if (canvasEvents.includes(event.name))
    acc.events.push(new SavedCanvasEvent(event, { board_id: acc.currBoardId }))
  else
    acc.events.push(new SavedEvent(event, { board_id: acc.currBoardId }))

  return acc
}, {
  currBoardId: newFirstBoardId,
  events: []
})
.events.map(event => {
  event.data = event.data ? JSON.stringify(event.data) : null

  return event
})

console.log(result.map(e => {
  return {
    id_event: e.id_event,
    name: e.name,
    board_id: e.board_id,
    is_canvas_event: e.is_canvas_event
  }
}))
